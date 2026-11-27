// _lib/tiktok.js — TikTok Login Kit + token helpers (server-side only).
// Plan: IMPLEMENTATION-PLAN.md §1.1 (flow), §1.2 (_lib/tiktok.js),
// §1.4 (refresh). Implemented: authorize URL, code exchange, user info,
// and revoke (used by the disconnect endpoint, §1.6). Refresh and the
// Content Posting helpers belong to the dispatcher work — not built yet.
//
// ============================ MOCK MODE =====================================
// Mock mode is ON when either:
//   - env.TIKTOK_MOCK === '1'  (explicit, the plan's Phase-0 switch), or
//   - TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET are absent from env.
// In mock mode NO call is ever made to TikTok: start.js redirects straight
// to our own callback with a fake code, and callback.js mints a clearly
// fake demo account + fake (encrypted) tokens. The moment real credentials
// are set as Pages secrets (and TIKTOK_MOCK is unset), the same code paths
// run the real flow with no code change.
// ============================================================================

export const TIKTOK_SCOPES = ['user.info.basic', 'video.upload', 'video.publish'];
export const MOCK_CODE = 'mock_code';

export function isMockMode(env) {
  if (env.TIKTOK_MOCK === '1') return true;
  return !env.TIKTOK_CLIENT_KEY || !env.TIKTOK_CLIENT_SECRET;
}

export function redirectUri(env, appBaseUrl) {
  return `${appBaseUrl}/auth/tiktok/callback`;
}

/** Step 1 of the flow: the authorize URL the user is redirected to. */
export function buildAuthorizeUrl(env, appBaseUrl, state) {
  const params = new URLSearchParams({
    client_key: env.TIKTOK_CLIENT_KEY,
    response_type: 'code',
    scope: TIKTOK_SCOPES.join(','),
    redirect_uri: redirectUri(env, appBaseUrl),
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

/**
 * Step 4: exchange the authorization code for tokens (server-side only —
 * uses the client secret). Returns TikTok's token payload:
 * { access_token, refresh_token, open_id, scope, expires_in, refresh_expires_in }.
 */
export async function exchangeCode(env, appBaseUrl, code) {
  const body = new URLSearchParams({
    client_key: env.TIKTOK_CLIENT_KEY,
    client_secret: env.TIKTOK_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri(env, appBaseUrl),
  });
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    const msg = data?.error_description || data?.error || `HTTP ${res.status}`;
    throw new Error(`TikTok code exchange failed: ${msg}`);
  }
  return data;
}

/**
 * Revoke an access token (disconnect, plan §1.6 step 2). Best-effort by
 * design: resolves true only when TikTok accepted the revocation. Any
 * failure resolves false — the caller must still wipe the local token
 * rows, because the data-deletion promise is about our database.
 */
export async function revokeToken(env, accessToken) {
  try {
    const body = new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY,
      client_secret: env.TIKTOK_CLIENT_SECRET,
      token: accessToken,
    });
    const res = await fetch('https://open.tiktokapis.com/v2/oauth/revoke/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Step 5: the connected account's public profile fields. */
export async function fetchUserInfo(accessToken) {
  const fields = 'open_id,union_id,avatar_url,avatar_url_100,display_name,username';
  const res = await fetch(
    `https://open.tiktokapis.com/v2/user/info/?fields=${encodeURIComponent(fields)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.data?.user) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(`TikTok user/info failed: ${msg}`);
  }
  return data.data.user;
}

/** Normalise a TikTok token payload into stored expiry timestamps. */
export function tokenExpiries(tokenPayload, now = new Date()) {
  const accessSec = Number(tokenPayload.expires_in) || 86400; // 24h per plan §1.4
  const refreshSec = Number(tokenPayload.refresh_expires_in) || 31536000; // 365d
  return {
    accessExpiresAt: new Date(now.getTime() + accessSec * 1000).toISOString(),
    refreshExpiresAt: new Date(now.getTime() + refreshSec * 1000).toISOString(),
  };
}

/** Split TikTok's comma-joined granted-scope string into an array. */
export function grantedScopes(tokenPayload) {
  if (!tokenPayload?.scope) return [];
  return String(tokenPayload.scope).split(',').map((s) => s.trim()).filter(Boolean);
}
