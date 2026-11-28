// POST /api/webhooks/tiktok — TikTok webhook receiver (authorization
// lifecycle events). Registered as the app's webhook callback URL in
// the TikTok developer portal.
//
// Signature (TikTok's scheme): the `Tiktok-Signature` header carries
// `t=<unix ts>,s=<hex>` where hex = HMAC-SHA256, keyed with the app's
// client secret, over the string `<ts>.<raw request body>`. The body
// MUST be hashed raw, exactly as received — any JSON round-trip first
// would change the bytes and break verification. Missing or invalid
// signature -> 401, and nothing is recorded or acted on.
//
// After the signature passes, the answer is ALWAYS 200 { ok: true }:
// TikTok retries non-2xx deliveries, and a bookkeeping failure on our
// side must never turn into a retry storm. The event is recorded in
// webhook_events (best-effort, service role) and then applied:
//
//   authorization.removed — the user revoked this app's grant inside
//   TikTok. The local effects mirror the disconnect endpoint
//   (api/accounts/[id]/disconnect.js): the tiktok_tokens row is
//   DELETED and the account is set status='disconnected' with
//   disconnected_at stamped; the account's open queue items are failed
//   with fail_reason='account_disconnected' so nothing can publish
//   from a revoked grant. (The disconnect endpoint's best-effort
//   revoke call is skipped — the grant is already gone at TikTok;
//   that is the whole point of the event.)

import { supabaseService, hasServiceRole, eq } from '../../_lib/supabase.js';
import { json, timingSafeEqual } from '../../_lib/guard.js';

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Parse `t=<ts>,s=<hex>`; returns { t, s } or null when malformed. */
function parseSignatureHeader(header) {
  if (!header) return null;
  const parts = {};
  for (const segment of String(header).split(',')) {
    const eqAt = segment.indexOf('=');
    if (eqAt <= 0) continue;
    parts[segment.slice(0, eqAt).trim()] = segment.slice(eqAt + 1).trim();
  }
  return parts.t && parts.s ? parts : null;
}

export async function onRequestPost({ request, env }) {
  const rawBody = await request.text();

  const secret = env.TIKTOK_CLIENT_SECRET;
  const sig = parseSignatureHeader(request.headers.get('tiktok-signature'));
  if (!secret || !sig) {
    return json({ error: 'invalid_signature' }, 401);
  }
  const expected = await hmacSha256Hex(secret, `${sig.t}.${rawBody}`);
  if (!timingSafeEqual(expected, sig.s.toLowerCase())) {
    return json({ error: 'invalid_signature' }, 401);
  }

  // Signature valid — from here on the answer is always 200.
  try {
    let body = null;
    try { body = JSON.parse(rawBody); } catch { body = null; }
    if (body && hasServiceRole(env)) {
      const svc = supabaseService(env);
      const eventType = body.event ?? body.event_type ?? 'unknown';
      const openId =
        body.user_open_id ?? body.content?.open_id ?? body.open_id ?? null;

      // Record first (best-effort): the audit trail must exist even if
      // applying the event fails part-way.
      await svc.insert(
        'webhook_events',
        { event_type: eventType, open_id: openId, payload: body },
        { returning: false },
      ).catch(() => {});

      if (eventType === 'authorization.removed' && openId) {
        const rows = await svc.select(
          'tiktok_accounts',
          `${eq('open_id', openId)}&select=id`,
        ).catch(() => []);
        for (const row of Array.isArray(rows) ? rows : []) {
          // Same effects as the disconnect endpoint, in its order:
          // wipe the tokens, mark the account, fail its open items.
          await svc.remove('tiktok_tokens', eq('tiktok_account_id', row.id)).catch(() => {});
          await svc.update(
            'tiktok_accounts',
            { status: 'disconnected', disconnected_at: new Date().toISOString() },
            eq('id', row.id),
          ).catch(() => {});
          await svc.update(
            'queue_items',
            { status: 'failed', fail_reason: 'account_disconnected' },
            `${eq('tiktok_account_id', row.id)}&status=in.(draft,uploaded,scheduled)`,
          ).catch(() => {});
        }
      }
    }
  } catch {
    // Swallowed by design: TikTok still gets its 200 (see header).
  }
  return json({ ok: true });
}
