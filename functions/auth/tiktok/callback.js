// GET /auth/tiktok/callback — the TikTok portal Redirect URI.
// Plan: IMPLEMENTATION-PLAN.md §1.1 steps 3–6, §1.3 (token storage).
//   https://tiktok.oriptos.com/auth/tiktok/callback   (byte-identical
//   in the portal, in start.js's redirect_uri, and in this route.)
//
// Session model: TikTok redirects the BROWSER here, so no Authorization
// header exists on this request. Authentication of the flow is the plan's
// own mechanism (§1.1 step 3): the state must match the HttpOnly cookie
// set by start.js AND an unexpired oauth_states row. The state is
// single-use (consumed below, whatever happens next).
//
// TWO modes, carried by the state row (see start.js):
//   CONNECT mode — stateRow.user_id is set: the account is attached to
//   that session-verified site user, exactly as before.
//   LOGIN mode — stateRow.user_id is NULL (TikTok as PRIMARY sign-in):
//   after the exchange, the site user is resolved from the TikTok
//   open_id — an existing tiktok_accounts row names the user; otherwise
//   a new auth user is created under a synthetic email
//   (_lib/authAdmin.js) — the account + encrypted tokens are stored as
//   usual, and the browser is handed a one-time magic-link token in a
//   URL FRAGMENT (never a query param, never logged by servers) on
//   /login, which exchanges it for a real session via verifyOtp.
//
// MOCK MODE (see _lib/tiktok.js): no TikTok calls. A clearly-flagged demo
// account is created instead (username "demo.creator", open_id
// "mock_demo_creator" — STABLE across runs, so repeat mock logins
// resolve to the same site user; the schema has no is_demo column, so
// the open_id + username are the flag), with fake tokens stored through
// the same encrypted path.

import { supabaseService, hasServiceRole, eq } from '../../_lib/supabase.js';
import { encryptToken } from '../../_lib/crypto.js';
import { redirect, appBaseUrl } from '../../_lib/guard.js';
import {
  syntheticEmailForOpenId,
  createAuthUser,
  findAuthUserByEmail,
  generateMagicLinkToken,
} from '../../_lib/authAdmin.js';
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
  // LOGIN-mode failures land back on /login (the user has no session and
  // no dashboard to see an error on); connect-mode keeps `fail` above.
  const failLogin = (code) =>
    redirect(`${base}/login?error=${code}`, { 'Set-Cookie': CLEAR_COOKIE });

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
  // user_id NULL on the state row = LOGIN mode (TikTok as primary
  // sign-in): the site user is resolved/created below, from the TikTok
  // identity, once the profile is known.
  const loginMode = userId == null;

  const mock = isMockMode(env) || code === MOCK_CODE;
  if (code === MOCK_CODE && !isMockMode(env)) return fail('tiktok_state');

  let stage = 'exchange';
  try {
    let profile;
    let tokenPayload;
    let scopes;

    if (mock) {
      // ============================ MOCK MODE ============================
      profile = {
        // STABLE open_id (not derived from the site user): in LOGIN mode
        // there is no site user yet, and repeat mock logins must resolve
        // to the same created user. Connect mode re-connects this same
        // demo identity to whoever is signed in.
        open_id: 'mock_demo_creator',
        union_id: null,
        username: 'demo.creator',
        display_name: 'Demo Creator (Mock Mode)',
        avatar_url: null,
      };
      tokenPayload = {
        access_token: 'mock-access-token-mock_demo_creator',
        refresh_token: 'mock-refresh-token-mock_demo_creator',
        expires_in: 86400,
        refresh_expires_in: 31536000,
        scope: TIKTOK_SCOPES.join(','),
      };
      scopes = TIKTOK_SCOPES.slice();
      // ========================== /MOCK MODE =============================
    } else {
      tokenPayload = await exchangeCode(env, base, code);
      stage = 'userinfo';
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

    // --- LOGIN mode: resolve (or create) the site user ------------------
    // Connect mode keeps stateRow.user_id. Login mode resolves by TikTok
    // identity: an existing tiktok_accounts row for this open_id names
    // the user; otherwise a new auth user is created under the synthetic
    // email and its profiles row is inserted, before the shared
    // account/token upserts below run keyed on the resolved id.
    stage = 'resolve';
    let resolvedUserId = userId;
    if (loginMode) {
      const existing = await svc.selectOne('tiktok_accounts', eq('open_id', profile.open_id));
      if (existing) {
        resolvedUserId = existing.user_id;
      } else {
        const email = syntheticEmailForOpenId(profile.open_id);
        let authUser;
        try {
          authUser = await createAuthUser(env, {
            email,
            userMetadata: {
              provider: 'tiktok',
              tiktok_open_id: profile.open_id,
              tiktok_username: profile.username,
            },
          });
        } catch (createErr) {
          // Already-exists (a race, or an auth user whose account row
          // was removed): fall back to the lookup before giving up.
          authUser = await findAuthUserByEmail(env, email);
          if (!authUser) throw createErr;
        }
        resolvedUserId = authUser.id;
        await svc.upsert('profiles', { id: resolvedUserId, email }, 'id');
      }
    }

    stage = 'upsert';
    // --- Upsert the connected account (keyed on user_id + open_id) --------
    const nowIso = new Date().toISOString();
    const [account] = await svc.upsert(
      'tiktok_accounts',
      {
        user_id: resolvedUserId,
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

    // --- LOGIN mode: establish the browser session ----------------------
    // The account + tokens are stored; the browser still has no site
    // session. Mint a one-time magic-link token for the resolved user
    // and hand it over in a URL FRAGMENT on /login (fragments are never
    // sent to servers or written to access logs); the login page
    // exchanges it via verifyOtp and lands on the dashboard. The
    // user's email comes from their profiles row (the FK guarantees it
    // exists); the synthetic email is the fallback for safety.
    stage = 'magiclink';
    if (loginMode) {
      const profileRow = await svc.selectOne('profiles', eq('id', resolvedUserId));
      const email = (profileRow && profileRow.email) || syntheticEmailForOpenId(profile.open_id);
      const hashedToken = await generateMagicLinkToken(env, email);
      if (!hashedToken) return failLogin('tiktok_login_failed');
      return redirect(`${base}/login#tt_session=${encodeURIComponent(hashedToken)}`, {
        'Set-Cookie': CLEAR_COOKIE,
      });
    }

    return redirect(`${base}/dashboard?connected=tiktok${mock ? '&demo=1' : ''}`, {
      'Set-Cookie': CLEAR_COOKIE,
    });
  } catch {
    return loginMode ? failLogin('tiktok_login_failed') : fail('tiktok_exchange');
  }
}
