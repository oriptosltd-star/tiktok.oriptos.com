// GET /api/account/insights — Display-API analytics for every TikTok
// account the caller has connected: extended profile, account stats and
// the account's own recent videos (views/likes/comments/shares).
//
// Data path per account:
//   1. CACHE — a fresh (< 10 min) row in account_insights (service role;
//      the table has RLS with no policies, so only the server can read
//      it) is served as-is and TikTok is never called.
//   2. LIVE — otherwise the stored token is loaded + decrypted (+
//      refreshed when due, the dispatcher's §1.4 lifecycle mirrored),
//      then fetchUserInfoExtended + listUserVideos run against TikTok,
//      the shaped result is cached (best-effort upsert) and the stats
//      columns on tiktok_accounts are updated (best-effort).
//
// Failure posture (contract):
//   - Cache read/write failures DEGRADE SILENTLY — including the table
//     not existing yet (the owner runs schema-analytics.sql by hand).
//     Live data is still returned; this endpoint never 500s over cache.
//   - TikTok-side failures NEVER 500 either. The common case is a token
//     minted before the extended scopes were granted: TikTok answers
//     with a scope error, and the account is returned with
//     needsReconnect: true, profile/stats null, videos []. The user
//     reconnects (with TIKTOK_EXTENDED_SCOPES=1 by then) and the next
//     call succeeds.
//   - 401 is reserved for a missing/invalid site session, exactly like
//     /api/account/status.
//   - Mock mode (no TikTok credentials): there is nothing real to
//     fetch, so accounts are returned with empty insights and
//     needsReconnect: false — the demo account must not cry wolf.

import { supabaseForUser, supabaseService, hasServiceRole, eq } from '../../_lib/supabase.js';
import { requireUser, json, jsonError } from '../../_lib/guard.js';
import {
  isMockMode,
  accessTokenNeedsRefresh,
  refreshAccessToken,
  tokenExpiries,
  fetchUserInfoExtended,
  listUserVideos,
} from '../../_lib/tiktok.js';
import { encryptToken, decryptToken } from '../../_lib/crypto.js';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10-minute insights cache

function codedError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// ---------------------------------------------------------------------------
// Token lifecycle — the dispatcher's freshAccessToken (plan §1.4) mirrored
// for a bare account id: load + decrypt, refresh when expired or within
// 60s of expiry, persist the rotated pair re-encrypted. A rejected
// refresh marks the account 'expired', exactly as in dispatch. Throws a
// coded Error: tokens_missing / token_decrypt_failed / account_expired.
// ---------------------------------------------------------------------------
async function freshAccessToken(svc, env, accountId) {
  const tokens = await svc.selectOne(
    'tiktok_tokens',
    `${eq('tiktok_account_id', accountId)}&select=*`,
  );
  if (!tokens) {
    throw codedError('tokens_missing', `no stored tokens for account ${accountId}`);
  }
  let accessToken;
  let refreshToken;
  try {
    accessToken = await decryptToken(env, tokens.access_token_enc);
    refreshToken = await decryptToken(env, tokens.refresh_token_enc);
  } catch {
    throw codedError('token_decrypt_failed', 'stored tokens could not be decrypted');
  }
  if (!accessTokenNeedsRefresh(tokens.access_expires_at)) {
    return accessToken;
  }
  let payload;
  try {
    payload = await refreshAccessToken(env, refreshToken);
  } catch (err) {
    await svc.update('tiktok_accounts', {
      status: 'expired',
      last_error: String(err.message).slice(0, 300),
    }, eq('id', accountId)).catch(() => {});
    throw codedError('account_expired', 'TikTok refresh token rejected; account needs reconnecting');
  }
  // TikTok rotates BOTH tokens — persist the new pair together (plan §1.4).
  const { accessExpiresAt, refreshExpiresAt } = tokenExpiries(payload);
  await svc.update('tiktok_tokens', {
    access_token_enc: await encryptToken(env, payload.access_token),
    refresh_token_enc: await encryptToken(env, payload.refresh_token),
    access_expires_at: accessExpiresAt,
    refresh_expires_at: refreshExpiresAt,
  }, eq('tiktok_account_id', accountId));
  await svc.update('tiktok_accounts', {
    last_refreshed_at: new Date().toISOString(),
    last_error: null,
  }, eq('id', accountId)).catch(() => {});
  return payload.access_token;
}

// ---------------------------------------------------------------------------
// Shaping — TikTok payloads onto the response contract.
// ---------------------------------------------------------------------------
function numOrNull(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function shapeVideo(v) {
  return {
    id: v.id ?? null,
    title: v.title ?? v.video_description ?? '',
    coverUrl: v.cover_image_url ?? null,
    // TikTok's create_time is epoch SECONDS; the contract speaks ISO.
    createTime: v.create_time != null
      ? new Date(Number(v.create_time) * 1000).toISOString()
      : null,
    duration: numOrNull(v.duration),
    viewCount: numOrNull(v.view_count),
    likeCount: numOrNull(v.like_count),
    commentCount: numOrNull(v.comment_count),
    shareCount: numOrNull(v.share_count),
    videoUrl: v.share_url ?? null,
  };
}

function shapeEntry(account, user, videosData, updatedAtIso) {
  const videos = Array.isArray(videosData?.videos) ? videosData.videos : [];
  return {
    id: account.id,
    openId: account.open_id,
    displayName: user.display_name ?? account.display_name ?? null,
    username: user.username ?? account.username ?? null,
    avatarUrl: user.avatar_url ?? account.avatar_url ?? null,
    connected: true,
    needsReconnect: false,
    profile: {
      bio: user.bio_description ?? null,
      profileUrl: user.profile_web_link ?? null,
      isVerified: Boolean(user.is_verified),
    },
    stats: {
      followers: numOrNull(user.follower_count),
      following: numOrNull(user.following_count),
      likes: numOrNull(user.likes_count),
      videos: numOrNull(user.video_count),
    },
    videos: videos.map(shapeVideo),
    insightsUpdatedAt: updatedAtIso,
  };
}

/** The account as returned when no live insights can be produced. */
function baseEntry(account, needsReconnect) {
  return {
    id: account.id,
    openId: account.open_id,
    displayName: account.display_name ?? null,
    username: account.username ?? null,
    avatarUrl: account.avatar_url ?? null,
    connected: true,
    needsReconnect,
    profile: null,
    stats: null,
    videos: [],
    insightsUpdatedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Cache — account_insights, service role only. EVERY failure is a cache
// miss: the table may not exist yet (owner-run SQL), and a cache must
// never take the endpoint down with it.
// ---------------------------------------------------------------------------
async function readCache(svc, accountId) {
  try {
    const row = await svc.selectOne(
      'account_insights',
      `${eq('account_id', accountId)}&select=payload,updated_at`,
    );
    if (!row || !row.payload || !row.updated_at) return null;
    const ageMs = Date.now() - new Date(row.updated_at).getTime();
    if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > CACHE_TTL_MS) return null;
    return { ...row.payload, insightsUpdatedAt: row.updated_at };
  } catch {
    return null;
  }
}

async function entryFor(env, svc, account, mock) {
  if (mock) return baseEntry(account, false);
  if (!svc) return baseEntry(account, true); // no service role -> tokens unreachable

  const cached = await readCache(svc, account.id);
  if (cached) return cached;

  let user;
  let videosData;
  try {
    const accessToken = await freshAccessToken(svc, env, account.id);
    user = await fetchUserInfoExtended(accessToken);
    videosData = await listUserVideos(accessToken);
  } catch {
    // Scope error on a pre-extended-scopes token, a revoked/expired
    // grant, a TikTok outage — all the same answer to the caller:
    // reconnect. Never a 500.
    return baseEntry(account, true);
  }

  const nowIso = new Date().toISOString();
  const entry = shapeEntry(account, user, videosData, nowIso);

  // Best-effort: mirror the stats onto tiktok_accounts (the columns
  // arrive with the same owner-run SQL as the cache table, so this may
  // legitimately fail until then) and warm the cache. Neither failure
  // may affect the response.
  await svc.update('tiktok_accounts', {
    username: user.username ?? null,
    bio: user.bio_description ?? null,
    profile_url: user.profile_web_link ?? null,
    is_verified: Boolean(user.is_verified),
    followers_count: numOrNull(user.follower_count),
    following_count: numOrNull(user.following_count),
    likes_count: numOrNull(user.likes_count),
    video_count: numOrNull(user.video_count),
    stats_updated_at: nowIso,
  }, eq('id', account.id)).catch(() => {});
  await svc.upsert(
    'account_insights',
    { account_id: account.id, payload: entry, updated_at: nowIso },
    'account_id',
  ).catch(() => {});

  return entry;
}

export async function onRequestGet({ request, env }) {
  try {
    const { user, token } = await requireUser(request, env);
    // Ownership read under RLS, same as /api/account/status: the caller
    // can only ever see their own accounts.
    const db = supabaseForUser(env, token);
    const rows = await db.select(
      'tiktok_accounts',
      `${eq('user_id', user.id)}&${eq('status', 'connected')}` +
        '&select=id,open_id,username,display_name,avatar_url,status,connected_at' +
        '&order=connected_at.desc&limit=100',
    );
    const accounts = Array.isArray(rows) ? rows : [];
    if (!accounts.length) return json({ accounts: [] });

    const svc = hasServiceRole(env) ? supabaseService(env) : null;
    const mock = isMockMode(env);
    const out = [];
    for (const account of accounts) {
      out.push(await entryFor(env, svc, account, mock));
    }
    return json({ accounts: out });
  } catch (err) {
    return jsonError(err);
  }
}
