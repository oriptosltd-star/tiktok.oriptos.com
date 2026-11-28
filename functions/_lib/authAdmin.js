// _lib/authAdmin.js — Supabase Auth Admin API helpers (server-side only).
// Used by the TikTok LOGIN-mode callback (auth/tiktok/callback.js) to turn
// a TikTok identity into a site session: on first use an auth user is
// created under a synthetic email; on every login-mode completion a
// one-time magic-link token is minted server-side and handed to the
// browser in a URL fragment, which the login page exchanges for a real
// session via supabase-js verifyOtp({ token_hash, type: 'magiclink' }).
//
// Fetch-only, no dependencies — same posture as _lib/supabase.js. Every
// call needs the service-role key (SUPABASE_SERVICE_ROLE_KEY); when it is
// absent these helpers throw a clear error and the caller fails closed —
// no session is ever fabricated client-side.

function base(env) {
  const url = env.SUPABASE_URL;
  if (!url) throw new Error('SUPABASE_URL is not set');
  return url.replace(/\/+$/, '');
}

function requireServiceKey(env) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return key;
}

async function adminFetch(env, path, { method = 'GET', body } = {}) {
  const key = requireServiceKey(env);
  const res = await fetch(`${base(env)}/auth/v1${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed = null;
  if (text) {
    try { parsed = JSON.parse(text); } catch { parsed = text; }
  }
  if (!res.ok) {
    const msg =
      (parsed && typeof parsed === 'object' && (parsed.message || parsed.msg)) ||
      (typeof parsed === 'string' ? parsed.slice(0, 300) : `HTTP ${res.status}`);
    const err = new Error(`Supabase Auth Admin ${method} ${path} failed (${res.status}): ${msg}`);
    err.status = res.status;
    throw err;
  }
  return parsed;
}

/**
 * The synthetic site email for a TikTok identity. Deterministic, so a
 * returning TikTok login always resolves to the same site user:
 *   "tt_" + open_id lowercased, every char outside [a-z0-9._-] -> "_"
 *   + "@oriptos.com"
 * (TikTok open_ids are opaque; the local part just needs to be a stable,
 * email-safe rendering of one.)
 */
export function syntheticEmailForOpenId(openId) {
  const local = String(openId).toLowerCase().replace(/[^a-z0-9._-]/g, '_');
  return `tt_${local}@oriptos.com`;
}

/**
 * Create a confirmed auth user (POST /auth/v1/admin/users). The user has
 * no password — TikTok is their sign-in. user_metadata records the
 * provider + TikTok identity for support/debugging.
 */
export async function createAuthUser(env, { email, userMetadata } = {}) {
  return adminFetch(env, '/admin/users', {
    method: 'POST',
    body: { email, email_confirm: true, user_metadata: userMetadata || {} },
  });
}

/**
 * Find an auth user by exact email (admin list, paged). Used as the
 * fallback when createAuthUser reports the user already exists (e.g. a
 * race between two login-mode completions, or an auth user whose
 * tiktok_accounts row was removed). Returns the user or null.
 */
export async function findAuthUserByEmail(env, email) {
  const target = String(email).toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const data = await adminFetch(env, `/admin/users?page=${page}&per_page=100`);
    const users = Array.isArray(data?.users) ? data.users : [];
    const hit = users.find((u) => String(u.email || '').toLowerCase() === target);
    if (hit) return hit;
    if (users.length < 100) return null;
  }
  return null;
}

/**
 * Mint a one-time magic-link token for an EXISTING user
 * (POST /auth/v1/admin/generate_link, type "magiclink") and return its
 * hashed_token — the value the browser passes to verifyOtp. Returns null
 * when the response carries no token; the caller must fail closed then.
 */
export async function generateMagicLinkToken(env, email) {
  const data = await adminFetch(env, '/admin/generate_link', {
    method: 'POST',
    body: { type: 'magiclink', email },
  });
  return data?.hashed_token || data?.properties?.hashed_token || null;
}
