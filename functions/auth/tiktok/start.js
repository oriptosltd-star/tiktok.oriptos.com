// GET /auth/tiktok/start — begin the TikTok account-connection flow.
// Plan: IMPLEMENTATION-PLAN.md §1.1 step 1, §1.2.
// Requires a site session (Supabase JWT in Authorization: Bearer). The
// dashboard calls this with fetch (redirect: 'manual') or asks for JSON
// with `Accept: application/json`, then navigates to the returned URL —
// a browser top-level navigation cannot carry the site's Bearer JWT,
// which is why the session is checked HERE, before the redirect, and the
// flow's user binding is carried by the oauth_states row + state cookie.
//
// MOCK MODE (see _lib/tiktok.js): instead of TikTok, we redirect straight
// to our own callback with a fake code + demo marker, so the whole flow
// is exercisable end-to-end before the developer app exists.

import { supabaseService, hasServiceRole, eq } from '../../_lib/supabase.js';
import { requireUser, redirect, json, jsonError, appBaseUrl, HttpError } from '../../_lib/guard.js';
import { isMockMode, buildAuthorizeUrl, MOCK_CODE } from '../../_lib/tiktok.js';

const STATE_TTL_MS = 10 * 60 * 1000; // plan §1.1: 10-minute expiry

function randomState() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestGet({ request, env }) {
  const base = appBaseUrl(env);
  try {
    const { user } = await requireUser(request, env);
    if (!hasServiceRole(env)) {
      throw new HttpError(503, 'service_role_not_configured',
        'SUPABASE_SERVICE_ROLE_KEY is not set; OAuth state cannot be stored');
    }

    const state = randomState();
    const svc = supabaseService(env);
    // The callback upserts into tables keyed on profiles(id) — make sure
    // the caller's profile row exists first.
    await svc.upsert('profiles', { id: user.id, email: user.email ?? '' }, 'id');
    await svc.insert('oauth_states', {
      state,
      user_id: user.id,
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
    if (err instanceof HttpError && err.status === 401) {
      // Browser-friendly: no session -> back to login.
      const wantsJson = (request.headers.get('Accept') || '').includes('application/json');
      if (!wantsJson) return redirect(`${base}/login?error=session_required`);
    }
    return jsonError(err);
  }
}
