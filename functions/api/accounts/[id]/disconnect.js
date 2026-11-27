// POST /api/accounts/:id/disconnect — disconnect one of the caller's
// TikTok accounts. Plan: IMPLEMENTATION-PLAN.md §1.6 — this is the
// data-deletion page's Option-1 promise ("Disconnect instantly wipes
// your stored authorization tokens from our database") made real.
//   1. Session-verified; the account must belong to the caller. The
//      ownership read goes through the caller's own client, so RLS
//      (tiktok_accounts: own rows readable, nothing else) is the wall —
//      a miss means "not yours" (or already gone) -> 404.
//   2. Real mode only: best-effort revoke of the stored access token at
//      TikTok, using the decrypted token. A revoke failure (or an
//      undecryptable row) NEVER blocks the local wipe. Mock mode skips
//      this step entirely — there is no real grant to revoke.
//   3. Always: the tiktok_tokens row is deleted and the account is set
//      status='disconnected', disconnected_at=now(). Both writes go
//      through the service role because they cannot be done any other
//      way: tiktok_tokens has ZERO client policies and tiktok_accounts
//      has no client write policy at all (schema RLS section).
//   4. The account's open queue items (draft/uploaded/scheduled) are
//      failed with fail_reason='account_disconnected' (plan §1.6
//      step 4) — nothing may publish from a disconnected account. The
//      service role is exempt from the queue_items server-columns
//      trigger, so writing fail_reason here is legitimate.

import { supabaseForUser, supabaseService, hasServiceRole, eq } from '../../../_lib/supabase.js';
import { requireUser, json, jsonError, HttpError } from '../../../_lib/guard.js';
import { decryptToken } from '../../../_lib/crypto.js';
import { isMockMode, revokeToken } from '../../../_lib/tiktok.js';

export async function onRequestPost({ request, env, params }) {
  try {
    const { user, token } = await requireUser(request, env);
    const accountId = params.id;

    // Step 1: ownership, under RLS.
    const db = supabaseForUser(env, token);
    const account = await db.selectOne(
      'tiktok_accounts',
      `${eq('id', accountId)}&${eq('user_id', user.id)}&select=id,status`,
    );
    if (!account) throw new HttpError(404, 'not_found', 'TikTok account not found');

    if (!hasServiceRole(env)) {
      throw new HttpError(503, 'service_role_not_configured',
        'SUPABASE_SERVICE_ROLE_KEY is not set; stored tokens cannot be wiped');
    }
    const svc = supabaseService(env);

    // Step 2: best-effort revoke at TikTok (real mode only).
    let revoked = false;
    if (!isMockMode(env)) {
      const tokenRow = await svc.selectOne(
        'tiktok_tokens',
        `${eq('tiktok_account_id', accountId)}&select=access_token_enc`,
      );
      if (tokenRow && tokenRow.access_token_enc) {
        try {
          const accessToken = await decryptToken(env, tokenRow.access_token_enc);
          revoked = await revokeToken(env, accessToken);
        } catch {
          revoked = false; // undecryptable or rejected — wipe proceeds
        }
      }
    }

    // Step 3: the local wipe — unconditional.
    await svc.remove('tiktok_tokens', eq('tiktok_account_id', accountId));
    await svc.update(
      'tiktok_accounts',
      { status: 'disconnected', disconnected_at: new Date().toISOString() },
      eq('id', accountId),
    );

    // Step 4: fail the account's open queue items.
    await svc.update(
      'queue_items',
      { status: 'failed', fail_reason: 'account_disconnected' },
      `${eq('tiktok_account_id', accountId)}&status=in.(draft,uploaded,scheduled)`,
    );

    return json({ disconnected: true, id: accountId, revoked });
  } catch (err) {
    return jsonError(err);
  }
}
