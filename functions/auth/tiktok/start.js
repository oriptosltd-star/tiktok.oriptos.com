// GET /auth/tiktok/start — begin a TikTok OAuth flow. TWO modes, decided
// by whether the caller presents a valid site session (Supabase JWT in
// Authorization: Bearer):
//
//   CONNECT mode (valid JWT) — the original flow: the state row is bound
//   to that site user, and the callback attaches the TikTok account to
//   them. Used by the dashboard's "Connect TikTok" and by the login page
//   when a session already exists.
//
//   LOGIN mode (no JWT, or an invalid/expired one) — TikTok as PRIMARY
//   sign-in: the state row is stored with user_id NULL, and the callback
//   resolves-or-creates the site user from the TikTok identity and hands
//   the browser a one-time session token. Clicking "Continue with
//   TikTok" therefore never demands an existing site account.
//
// In both modes the state is stored in oauth_states (10-minute expiry,
// single-use — consumed by the callback) and mirrored in the
// `oauth_state` HttpOnly cookie, which is how the callback authenticates
// the browser redirect (a top-level navigation cannot carry the Bearer
// JWT — the session lives in supabase-js localStorage, not a cookie).
// Anonymous hits are welcome now: there is no /login bounce here.
//
// MOCK MODE (see _lib/tiktok.js): instead of TikTok, we redirect straight
// to our own callback with a fake code + demo marker, so both modes are
// exercisable end-to-end before the developer app exists.

import { supabaseService, hasServiceRole, getAuthUser } from '../../_lib/supabase.js';
import { bearerToken, redirect, json, jsonError, appBaseUrl, HttpError } from '../../_lib/guard.js';
import { isMockMode, buildAuthorizeUrl, MOCK_CODE } from '../../_lib/tiktok.js';

const STATE_TTL_MS = 10 * 60 * 1000; // plan §1.1: 10-minute expiry

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestGet({ request, env }) {
  const base = appBaseUrl(env);
  try {
    if (!hasServiceRole(env)) {
      throw new HttpError(503, 'service_role_not_configured',
        'SUPABASE_SERVICE_ROLE_KEY is not set; OAuth state cannot be stored');
    }

    // Mode decision: a valid Bearer JWT -> CONNECT (state bound to that
    // user); anything else (absent, malformed, expired) -> LOGIN (state
    // with user_id NULL). An invalid token is NOT an error here — it
    // simply means "not signed in", which login mode exists for.
    const token = bearerToken(request);
    const user = token ? await getAuthUser(env, token) : null;

    const state = randomState();
    const svc = supabaseService(env);
    if (user) {
      // CONNECT mode: the callback upserts into tables keyed on
      // profiles(id) — make sure the caller's profile row exists first.
      await svc.upsert('profiles', { id: user.id, email: user.email ?? '' }, 'id');
    }
    await svc.insert('oauth_states', {
      state,
      user_id: user ? user.id : null,
      expires_at: new Date(Date.now() + STATE_TTL_MS).toISOString(),
    });

    const cookie =
      `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/auth/tiktok; Max-Age=600`;

    const mock = isMockMode(env);
    const target = mock
      ? `${base}/auth/tiktok/callback?code=${MOCK_CODE}&state=${state}&mock=1`
      : buildAuthorizeUrl(env, base, state);

    const wantsJson = (request.headers.get('Accept') || '').includes('application/json');
    if (wantsJson) {
      return json({ url: target, demoMode: mock }, 200, { 'Set-Cookie': cookie });
    }
    return redirect(target, { 'Set-Cookie': cookie });
  } catch (err) {
    return jsonError(err);
  }
}
