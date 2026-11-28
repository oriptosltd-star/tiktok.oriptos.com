// _lib/tiktok.js — TikTok Login Kit + token helpers (server-side only).
// Plan: IMPLEMENTATION-PLAN.md §1.1 (flow), §1.2 (_lib/tiktok.js),
// §1.4 (refresh), §3.3 (Direct Post sequence). Implemented: authorize
// URL, code exchange, user info, revoke (used by the disconnect
// endpoint, §1.6), access-token refresh, and the Content Posting
// helpers (creator_info, video init, publish-status fetch) plus the
// pure posting decisions the dispatcher makes (chunk math, privacy
// selection, status mapping, refresh predicate) — the pure helpers
// carry no network code and are unit-tested in tests.mjs.
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
async function fetchUserInfoFields(accessToken, fields) {
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

export async function fetchUserInfo(accessToken) {
  // Only fields covered by the granted scopes (user.info.basic): requesting a
  // field outside the scopes (e.g. username, which needs user.info.username)
  // makes TikTok reject the WHOLE call. Fall back to open_id alone so a
  // profile-field hiccup can never block sign-in.
  try {
    return await fetchUserInfoFields(accessToken, 'open_id,union_id,avatar_url,display_name');
  } catch (e) {
    return fetchUserInfoFields(accessToken, 'open_id');
  }
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

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * A failed TikTok API call. Carries the HTTP status and TikTok's own
 * error code (the Content Posting `error.code`, or the OAuth endpoint's
 * top-level `error`) so callers can record both on the publish_attempts
 * row instead of flattening everything into a message string.
 */
export class TikTokApiError extends Error {
  constructor(message, { httpStatus = null, code = null } = {}) {
    super(message);
    this.name = 'TikTokApiError';
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

/** Build a plain Error carrying a machine-readable `.code`. */
function codedError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// ---------------------------------------------------------------------------
// Token refresh (plan §1.4)
// ---------------------------------------------------------------------------

/**
 * How close to expiry an access token may be before the publish path
 * refreshes it first: expired, or within this window of expiring.
 */
export const ACCESS_REFRESH_SKEW_MS = 60 * 1000;

/**
 * Pure predicate: must this access token be refreshed before use?
 * A missing or unparseable expiry is treated as "yes" — never publish
 * on a token whose freshness cannot be proven.
 */
export function accessTokenNeedsRefresh(accessExpiresAt, now = new Date(), skewMs = ACCESS_REFRESH_SKEW_MS) {
  if (!accessExpiresAt) return true;
  const expiryMs = new Date(accessExpiresAt).getTime();
  if (!Number.isFinite(expiryMs)) return true;
  return expiryMs - now.getTime() <= skewMs;
}

/**
 * Exchange a refresh token for a fresh token pair (plan §1.4). TikTok
 * rotates BOTH tokens: the caller must persist the returned access AND
 * refresh tokens (re-encrypted) with their new expiries, or the account
 * is stranded. Returns TikTok's token payload, same shape as
 * exchangeCode(). Throws TikTokApiError on any failure.
 */
export async function refreshAccessToken(env, refreshToken) {
  const body = new URLSearchParams({
    client_key: env.TIKTOK_CLIENT_KEY,
    client_secret: env.TIKTOK_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    const msg = data?.error_description || data?.error || `HTTP ${res.status}`;
    throw new TikTokApiError(`TikTok token refresh failed: ${msg}`, {
      httpStatus: res.status,
      code: data?.error || null,
    });
  }
  return data;
}

// ---------------------------------------------------------------------------
// Content Posting — Direct Post (plan §3.3)
// ---------------------------------------------------------------------------

/**
 * Shared POST for the Content Posting endpoints. Their envelope is
 * { data, error: { code, message, log_id } } with error.code === 'ok'
 * on success (sometimes over an HTTP 200). Resolves with `data`;
 * throws TikTokApiError otherwise. Callers that log an attempt row may
 * record httpStatus 200 for a resolved call — this helper only
 * resolves on a 2xx with an 'ok' (or absent) error code.
 */
async function contentPostingPost(accessToken, path, body) {
  const res = await fetch(`https://open.tiktokapis.com${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  const apiError = data?.error;
  if (!res.ok || (apiError && apiError.code && apiError.code !== 'ok')) {
    throw new TikTokApiError(apiError?.message || `TikTok ${path} failed: HTTP ${res.status}`, {
      httpStatus: res.status,
      code: apiError?.code || null,
    });
  }
  return data?.data ?? {};
}

/**
 * Step 2 of the publish sequence: the creator gate. Returns TikTok's
 * creator info ({ creator_username, creator_nickname, privacy_level_options,
 * comment_disabled, duet_disabled, stitch_disabled,
 * max_video_post_duration_sec, ... }). An explicit
 * `creator_can_post === false` in the response means the creator cannot
 * direct-post right now (plan §3.3 step 2).
 */
export function queryCreatorInfo(accessToken) {
  return contentPostingPost(accessToken, '/v2/post/publish/creator_info/query/');
}

/**
 * Step 3: initialise a Direct Post with source FILE_UPLOAD. Returns
 * { publish_id, upload_url }. The caller must persist publish_id
 * BEFORE sending any chunk (plan §3.6 crash rule).
 */
export function initDirectPost(accessToken, { postInfo, sourceInfo }) {
  return contentPostingPost(accessToken, '/v2/post/publish/video/init/', {
    post_info: postInfo,
    source_info: sourceInfo,
  });
}

/**
 * Step 5: poll a publish. Returns { status, fail_reason,
 * publicaly_available_post_id, uploaded_bytes } — status is one of
 * PROCESSING_DOWNLOAD / PROCESSING_UPLOAD / PUBLISH_COMPLETE / FAILED /
 * SEND_TO_USER_INBOX.
 */
export function fetchPublishStatus(accessToken, publishId) {
  return contentPostingPost(accessToken, '/v2/post/publish/status/fetch/', {
    publish_id: publishId,
  });
}

// ---------------------------------------------------------------------------
// Pure posting decisions (no network — unit-tested in tests.mjs)
// ---------------------------------------------------------------------------

// TikTok's FILE_UPLOAD chunk rules (Media Transfer Guide): every chunk
// except the last is between 5 MB and 64 MB, at most 1000 chunks, the
// final chunk may be smaller, and a file that fits in one chunk is sent
// whole with chunk_size === video_size.
export const MIN_CHUNK_BYTES = 5 * 1024 * 1024;
export const MAX_CHUNK_BYTES = 64 * 1024 * 1024;
export const MAX_CHUNK_COUNT = 1000;

/**
 * Plan the chunking for a video of `videoSize` bytes.
 * Returns { videoSize, chunkSize, totalChunkCount }.
 * Throws a coded Error ('invalid_video_size' /
 * 'video_too_large_for_upload') when no valid plan exists: with the
 * chunk size already at TikTok's 64 MB ceiling, a file needing more
 * than 1000 chunks cannot be chunked legally at all, so it fails
 * clearly instead of producing a plan TikTok would reject.
 */
export function planChunks(videoSize) {
  const size = Number(videoSize);
  if (!Number.isFinite(size) || size <= 0) {
    throw codedError('invalid_video_size', `invalid video size: ${videoSize}`);
  }
  if (size <= MAX_CHUNK_BYTES) {
    // One chunk: chunk_size equals video_size (TikTok's rule), even
    // below the 5 MB floor that applies to multi-chunk uploads.
    return { videoSize: size, chunkSize: size, totalChunkCount: 1 };
  }
  const totalChunkCount = Math.ceil(size / MAX_CHUNK_BYTES);
  if (totalChunkCount > MAX_CHUNK_COUNT) {
    throw codedError(
      'video_too_large_for_upload',
      `video of ${size} bytes needs ${totalChunkCount} chunks of 64 MB, over TikTok's ${MAX_CHUNK_COUNT}-chunk cap`,
    );
  }
  return { videoSize: size, chunkSize: MAX_CHUNK_BYTES, totalChunkCount };
}

/**
 * The byte range of chunk `index` (0-based) in a plan from planChunks.
 * `end` is inclusive, matching the Content-Range header format.
 */
export function chunkRange(plan, index) {
  const { videoSize, chunkSize, totalChunkCount } = plan;
  if (!Number.isInteger(index) || index < 0 || index >= totalChunkCount) {
    throw codedError('invalid_chunk_index', `chunk index ${index} outside 0..${totalChunkCount - 1}`);
  }
  const start = index * chunkSize;
  const end = Math.min(start + chunkSize, videoSize) - 1;
  return { index, start, end, size: end - start + 1 };
}

/**
 * Decide the privacy_level a Direct Post will actually use (plan §3.4).
 * While the client is unaudited, SELF_ONLY is forced regardless of the
 * requested level. Once audited, the requested level stands — but it
 * must exist (the schema deliberately has no default: the user must
 * choose) and, when TikTok reports the creator's options, it must be
 * one of them. Returns { privacyLevel, forced }; throws a coded Error
 * ('privacy_level_not_set' / 'privacy_level_not_allowed') otherwise.
 */
export function selectPrivacyLevel({ requested, creatorOptions, audited }) {
  if (!audited) {
    return { privacyLevel: 'SELF_ONLY', forced: true };
  }
  if (!requested) {
    throw codedError('privacy_level_not_set', 'no privacy_level chosen for this item');
  }
  if (
    Array.isArray(creatorOptions) &&
    creatorOptions.length > 0 &&
    !creatorOptions.includes(requested)
  ) {
    throw codedError(
      'privacy_level_not_allowed',
      `privacy_level ${requested} is not offered for this creator (options: ${creatorOptions.join(', ')})`,
    );
  }
  return { privacyLevel: requested, forced: false };
}

/**
 * Map a TikTok publish status onto the dispatcher's outcome vocabulary.
 * Anything unrecognised maps to 'processing': an unknown status must
 * never settle an item in either direction.
 */
export function mapPublishStatus(tiktokStatus) {
  switch (tiktokStatus) {
    case 'PUBLISH_COMPLETE':
      return { outcome: 'published' };
    case 'FAILED':
      return { outcome: 'failed' };
    case 'SEND_TO_USER_INBOX':
      // Terminal for the inbox (video.upload) flow: the video reached
      // the creator's TikTok inbox, which is that flow's success.
      return { outcome: 'published', inbox: true };
    default:
      return { outcome: 'processing' };
  }
}
