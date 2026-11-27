// GET /auth/tiktok/callback — the TikTok portal Redirect URI.
// Plan: IMPLEMENTATION-PLAN.md §1.1 steps 3–6, §1.3 (token storage).
//   https://tiktok.oriptos.com/auth/tiktok/callback   (byte-identical
//   in the portal, in start.js's redirect_uri, and in this route.)
//
// Session model: TikTok redirects the BROWSER here, so no Authorization
// header exists on this request. Authentication of the flow is the plan's
// own mechanism (§1.1 step 3): the state must match the HttpOnly cookie
// set by start.js AND an unexpired oauth_states row, and that row's
// user_id is the site user the account is attached to. The state was
// only ever issued to a session-verified user, and it is single-use.
//
// MOCK MODE (see _lib/tiktok.js): no TikTok calls. A clearly-flagged demo
// account is created instead (username "demo.creator", open_id prefixed
// "mock_" — the schema has no is_demo column, so the prefix + username
// are the flag), with fake tokens stored through the same encrypted path.

import { supabaseService, hasServiceRole, eq } from '../../_lib/supabase.js';
import { encryptToken } from '../../_lib/crypto.js';
import { redirect, appBaseUrl } from '../../_lib/guard.js';
import {
  isMockMode,
  exchangeCode,
  fetchUserInfo,
  tokenExpiries,
  grantedScopes,
  TIKTOK_SCOPES,
  MOCK_CODE,
} from '../../_lib/tiktok.js';

function stateFromCookie(request) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/(?:^|;\s*)oauth_state=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

const CLEAR_COOKIE =
  'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/auth/tiktok; Max-Age=0';

export async function onRequestGet({ request, env }) {
  const base = appBaseUrl(env);
  const fail = (code) =>
    redirect(`${base}/dashboard?error=${code}`, { 'Set-Cookie': CLEAR_COOKIE });

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  if (oauthError) return fail('tiktok_denied'); // user declined on TikTok's side
  if (!code || !state) return fail('tiktok_state');
  if (!hasServiceRole(env)) return fail('tiktok_not_configured');

  const svc = supabaseService(env);

  // --- State verification (plan §1.1 step 3) -------------------------------
  if (stateFromCookie(request) !== state) return fail('tiktok_state');
  const stateRow = await svc.selectOne('oauth_states', eq('state', state));
  if (!stateRow) return fail('tiktok_state');
  // Single-use: consume the state whatever happens next.
  await svc.remove('oauth_states', eq('state', state)).catch(() => {});
  if (new Date(stateRow.expires_at).getTime() < Date.now()) return fail('tiktok_state');
  const userId = stateRow.user_id;

  const mock = isMockMode(env) || code === MOCK_CODE;
  if (code === MOCK_CODE && !isMockMode(env)) return fail('tiktok_state');

  try {
    let profile;
    let tokenPayload;
    let scopes;

    if (mock) {
      // ============================ MOCK MODE ============================
      profile = {
        open_id: `mock_${userId}`,
        union_id: null,
        username: 'demo.creator',
        display_name: 'Demo Creator (Mock Mode)',
        avatar_url: null,
      };
      tokenPayload = {
        access_token: `mock-access-token-${userId}`,
        refresh_token: `mock-refresh-token-${userId}`,
        expires_in: 86400,
        refresh_expires_in: 31536000,
        scope: TIKTOK_SCOPES.join(','),
      };
      scopes = TIKTOK_SCOPES.slice();
      // ========================== /MOCK MODE =============================
    } else {
      tokenPayload = await exchangeCode(env, base, code);
      const info = await fetchUserInfo(tokenPayload.access_token);
      profile = {
        open_id: tokenPayload.open_id || info.open_id,
        union_id: info.union_id ?? null,
        username: info.username ?? null,
        display_name: info.display_name ?? null,
        avatar_url: info.avatar_url || info.avatar_url_100 || null,
      };
      scopes = grantedScopes(tokenPayload);
    }
    if (!profile.open_id) return fail('tiktok_exchange');

    // --- Upsert the connected account (keyed on user_id + open_id) --------
    const nowIso = new Date().toISOString();
    const [account] = await svc.upsert(
      'tiktok_accounts',
      {
        user_id: userId,
        open_id: profile.open_id,
        union_id: profile.union_id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        scopes,
        status: 'connected',
        connected_at: nowIso,
        disconnected_at: null,
        last_refreshed_at: nowIso,
        last_error: null,
      },
      'user_id,open_id',
    );

    // --- Store tokens ENCRYPTED in the server-only table (plan §1.3) -----
    const { accessExpiresAt, refreshExpiresAt } = tokenExpiries(tokenPayload);
    await svc.upsert(
      'tiktok_tokens',
      {
        tiktok_account_id: account.id,
        access_token_enc: await encryptToken(env, tokenPayload.access_token),
        refresh_token_enc: await encryptToken(env, tokenPayload.refresh_token),
        access_expires_at: accessExpiresAt,
        refresh_expires_at: refreshExpiresAt,
      },
      'tiktok_account_id',
    );

    return redirect(`${base}/dashboard?connected=tiktok${mock ? '&demo=1' : ''}`, {
      'Set-Cookie': CLEAR_COOKIE,
    });
  } catch {
    return fail('tiktok_exchange');
  }
}
