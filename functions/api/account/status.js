// GET /api/account/status — the caller's connected TikTok account.
// Returns public profile fields only (tokens never leave the server,
// plan §1.3) plus `demoMode`: true when TikTok credentials are absent
// (mock mode) or when the connected account is the mock demo account
// (open_id "mock_" prefix — the schema has no is_demo column).

import { supabaseForUser, eq } from '../../_lib/supabase.js';
import { requireUser, json, jsonError } from '../../_lib/guard.js';
import { isMockMode } from '../../_lib/tiktok.js';

export async function onRequestGet({ request, env }) {
  try {
    const { user, token } = await requireUser(request, env);
    const db = supabaseForUser(env, token);
    const rows = await db.select(
      'tiktok_accounts',
      `${eq('user_id', user.id)}&${eq('status', 'connected')}` +
        '&select=id,open_id,username,display_name,avatar_url,scopes,status,connected_at' +
        '&order=connected_at.desc&limit=1',
    );
    const account = Array.isArray(rows) && rows.length ? rows[0] : null;
    const demoMode =
      isMockMode(env) || Boolean(account && String(account.open_id).startsWith('mock_'));
    return json({ account, demoMode });
  } catch (err) {
    return jsonError(err);
  }
}
