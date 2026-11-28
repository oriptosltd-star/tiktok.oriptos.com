// POST /api/internal/dispatch — the scheduler tick.
// Plan: IMPLEMENTATION-PLAN.md §3.5 (option a: a thin Cloudflare Cron
// Worker POSTs here every minute) and §3.6 (the dispatcher's tick order).
// Guarded by DISPATCH_SECRET: any caller without it gets a 404, not a
// 401 — the endpoint does not advertise itself (plan §3.6).
//
// Tick order (plan §3.6): housekeeping -> status pass -> lease adoption
// -> claim pass -> publish pass.
//
// Publishing has two modes, decided by isMockMode() (_lib/tiktok.js):
//   - MOCK (no TikTok credentials): claimed items get a mock publish_id,
//     move to publish_phase='processing', and are settled to 'published'
//     by the NEXT tick's status pass — the full state machine is
//     exercised without TikTok.
//   - REAL: the full Direct Post sequence (plan §3.3) — token load +
//     refresh if expiring, creator_info gate, privacy selection
//     (SELF_ONLY forced while the client is unaudited, plan §3.4),
//     video/init with the publish_id persisted BEFORE any chunk (the
//     crash rule), chunked FILE_UPLOAD read out of R2, then bounded
//     status polling. Items still processing when the bounded polls run
//     out stay in 'publishing' with their publish_id persisted; later
//     ticks poll that publish_id — they never re-upload.

import { supabaseService, hasServiceRole, eq } from '../../_lib/supabase.js';
import { json, timingSafeEqual } from '../../_lib/guard.js';
import {
  isMockMode,
  accessTokenNeedsRefresh,
  refreshAccessToken,
  tokenExpiries,
  queryCreatorInfo,
  initDirectPost,
  fetchPublishStatus,
  planChunks,
  chunkRange,
  selectPrivacyLevel,
  mapPublishStatus,
} from '../../_lib/tiktok.js';
import { encryptToken, decryptToken } from '../../_lib/crypto.js';
import { presignGet } from '../../_lib/r2.js';

const CLAIM_LIMIT = 5; // plan §3.6 step 3 (N=5)
const LEASE_STALE_MS = 10 * 60 * 1000; // plan §3.6 crash rule: 10-minute lease
const DAILY_CAP = 15; // plan §3.4: per-creator cap, fail fast instead of burning an init
// Bounded in-run status polling after a real upload (plan §3.3 step 5 is
// normally settled across ticks; a few quick polls here let short
// processing windows finish in the same run without a long blocking wait).
const STATUS_POLL_ATTEMPTS = 3;
const STATUS_POLL_DELAYS_MS = [2000, 4000, 8000];

function lt(col, iso) { return `${col}=lt.${encodeURIComponent(iso)}`; }
function lte(col, iso) { return `${col}=lte.${encodeURIComponent(iso)}`; }
function gte(col, iso) { return `${col}=gte.${encodeURIComponent(iso)}`; }

async function logAttempt(svc, item, phase, detail, publishId = undefined, { httpStatus = null, tiktokErrorCode = null } = {}) {
  await svc.insert('publish_attempts', {
    queue_item_id: item.id,
    publish_id: publishId ?? item.publish_id ?? null,
    phase,
    http_status: httpStatus,
    tiktok_error_code: tiktokErrorCode,
    detail,
  }, { returning: false }).catch(() => {});
}

async function failItem(svc, item, reason, phase = 'init') {
  await logAttempt(svc, item, phase, `failed: ${reason}`, item.publish_id);
  await svc.update('queue_items', {
    status: 'failed',
    fail_reason: reason,
    publish_phase: null,
    locked_at: null,
    locked_by: null,
  }, `${eq('id', item.id)}&${eq('status', 'publishing')}`);
}

function codedError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// ---------------------------------------------------------------------------
// Token lifecycle (plan §1.4, lazy refresh): load the account's stored
// tokens, decrypt them, and — when the access token is expired or within
// 60s of expiry — refresh and persist the rotated pair re-encrypted
// BEFORE returning a usable access token. Throws a coded Error:
//   tokens_missing / token_decrypt_failed / account_expired.
// A rejected refresh marks the account 'expired' (plan §1.4): the user
// reconnects; nothing retries silently.
// ---------------------------------------------------------------------------
async function freshAccessToken(svc, env, item) {
  const accountId = item.tiktok_account_id;
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
    await logAttempt(svc, item, 'refresh',
      `token refresh failed: ${err.message}`, item.publish_id,
      { httpStatus: err.httpStatus ?? null, tiktokErrorCode: err.code ?? null });
    await svc.update('tiktok_accounts', {
      status: 'expired',
      last_error: String(err.message).slice(0, 300),
    }, eq('id', accountId)).catch(() => {});
    throw codedError('account_expired', 'TikTok refresh token rejected; account needs reconnecting');
  }
  // TikTok rotates BOTH tokens — persist the new pair together, or the
  // account is stranded with a dead refresh token (plan §1.4).
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
  await logAttempt(svc, item, 'refresh',
    'access token refreshed (expired or within 60s of expiry)', item.publish_id);
  return payload.access_token;
}

// ---------------------------------------------------------------------------
// Chunked FILE_UPLOAD (plan §3.3 step 4): read the video out of R2 one
// chunk at a time (unsigned Range header on a presigned GET — only the
// host is signed) and PUT each chunk to TikTok's upload_url with its
// Content-Range. Memory stays at one chunk (<= 64 MB). Throws a coded
// Error with .httpStatus on the first failed read or PUT.
// ---------------------------------------------------------------------------
async function uploadChunks(env, item, plan, uploadUrl) {
  const getUrl = await presignGet(
    { ...env, R2_BUCKET: item.r2_bucket || env.R2_BUCKET },
    item.r2_key,
    { expiresIn: 3600 },
  );
  for (let i = 0; i < plan.totalChunkCount; i++) {
    const { start, end, size } = chunkRange(plan, i);
    const src = await fetch(getUrl, { headers: { Range: `bytes=${start}-${end}` } });
    if (!(src.status === 206 || (src.status === 200 && plan.totalChunkCount === 1))) {
      const err = codedError('r2_read_failed', `R2 read for chunk ${i + 1}/${plan.totalChunkCount} returned HTTP ${src.status}`);
      err.httpStatus = src.status;
      throw err;
    }
    const buf = await src.arrayBuffer();
    if (buf.byteLength !== size) {
      throw codedError(
        'r2_size_mismatch',
        `R2 read for chunk ${i + 1}/${plan.totalChunkCount} returned ${buf.byteLength} bytes, expected ${size}`,
      );
    }
    const put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': item.mime_type || 'video/mp4',
        'Content-Range': `bytes ${start}-${end}/${plan.videoSize}`,
      },
      body: buf,
    });
    if (put.status !== 200 && put.status !== 201) {
      const err = codedError('chunk_upload_failed', `TikTok chunk ${i + 1}/${plan.totalChunkCount} PUT returned HTTP ${put.status}`);
      err.httpStatus = put.status;
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Status polling (plan §3.3 step 5). Polls fetchPublishStatus up to
// `attempts` times (delaysMs[i] is waited before poll i+1) and settles
// the item on a terminal status. Returns 'published' | 'failed' |
// 'processing'. A failed status FETCH is transient — logged, and the
// item is left in 'publishing' for the next tick, never settled on a
// guess.
// ---------------------------------------------------------------------------
async function pollPublishStatus(svc, item, accessToken, { attempts, delaysMs }) {
  for (let i = 0; i < attempts; i++) {
    const delay = delaysMs[i] ?? 0;
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    let data;
    try {
      data = await fetchPublishStatus(accessToken, item.publish_id);
    } catch (err) {
      await logAttempt(svc, item, 'status',
        `status fetch failed: ${err.message}`, item.publish_id,
        { httpStatus: err.httpStatus ?? null, tiktokErrorCode: err.code ?? null });
      return 'processing';
    }
    const { outcome } = mapPublishStatus(data.status);
    if (outcome === 'published') {
      const postId = Array.isArray(data.publicaly_available_post_id)
        ? data.publicaly_available_post_id[0]
        : null;
      await logAttempt(svc, item, 'status',
        `PUBLISH_COMPLETE${postId ? ` (post ${postId})` : ''}`, item.publish_id,
        { httpStatus: 200 });
      await svc.update('queue_items', {
        status: 'published',
        publish_phase: null,
        published_at: new Date().toISOString(),
        locked_at: null,
        locked_by: null,
      }, `${eq('id', item.id)}&${eq('status', 'publishing')}`);
      return 'published';
    }
    if (outcome === 'failed') {
      const reason = data.fail_reason || 'publish_failed';
      await logAttempt(svc, item, 'status', `FAILED: ${reason}`, item.publish_id,
        { httpStatus: 200 });
      await failItem(svc, item, reason, 'status');
      return 'failed';
    }
    await logAttempt(svc, item, 'status',
      `still processing (${data.status || 'unknown'})`, item.publish_id,
      { httpStatus: 200 });
  }
  return 'processing';
}

// ---------------------------------------------------------------------------
// The REAL Direct Post sequence for one claimed item (plan §3.3).
// The account gate and daily cap already ran in publishOne.
// ---------------------------------------------------------------------------
async function publishOneReal(svc, env, item, summary) {
  // Step 1 — token lifecycle.
  let accessToken;
  try {
    accessToken = await freshAccessToken(svc, env, item);
  } catch (err) {
    await failItem(svc, item, err.code || 'token_unavailable', 'refresh');
    summary.failed++;
    return;
  }

  // Step 2 — creator gate.
  let creator;
  try {
    creator = await queryCreatorInfo(accessToken);
  } catch (err) {
    await logAttempt(svc, item, 'init',
      `creator_info failed: ${err.message}`, item.publish_id,
      { httpStatus: err.httpStatus ?? null, tiktokErrorCode: err.code ?? null });
    await failItem(svc, item, `init:${err.code || `http_${err.httpStatus}`}`, 'init');
    summary.failed++;
    return;
  }
  if (creator.creator_can_post === false) {
    await failItem(svc, item, 'creator_cannot_post', 'init');
    summary.failed++;
    return;
  }
  if (
    item.duration_sec != null &&
    creator.max_video_post_duration_sec != null &&
    Number(item.duration_sec) > Number(creator.max_video_post_duration_sec)
  ) {
    await failItem(svc, item, 'video_exceeds_max_duration', 'init');
    summary.failed++;
    return;
  }

  // Step 2b — privacy (plan §3.4): SELF_ONLY forced while unaudited.
  let privacy;
  try {
    privacy = selectPrivacyLevel({
      requested: item.privacy_level,
      creatorOptions: creator.privacy_level_options,
      audited: env.TIKTOK_CLIENT_AUDITED === '1',
    });
  } catch (err) {
    await failItem(svc, item, err.code || 'privacy_level_invalid', 'init');
    summary.failed++;
    return;
  }

  // Step 3a — chunk plan (pure math; fails clearly on impossible sizes).
  let plan;
  try {
    plan = planChunks(item.file_size_bytes);
  } catch (err) {
    await failItem(svc, item, err.code || 'invalid_video_size', 'init');
    summary.failed++;
    return;
  }

  // Step 3b — init. The schema stores allow_* booleans; TikTok takes
  // disable_* — the mapping is the inversion, and the schema defaults
  // (allow_* = false) give TikTok's required toggles-off default.
  const postInfo = {
    title: item.caption || '',
    privacy_level: privacy.privacyLevel,
    disable_comment: !item.allow_comment,
    disable_duet: !item.allow_duet,
    disable_stitch: !item.allow_stitch,
  };
  if (item.is_commercial_content) {
    if (item.commercial_content_type === 'branded_content') postInfo.brand_content_toggle = true;
    else if (item.commercial_content_type === 'your_brand') postInfo.brand_organic_toggle = true;
  }
  let init;
  try {
    init = await initDirectPost(accessToken, {
      postInfo,
      sourceInfo: {
        source: 'FILE_UPLOAD',
        video_size: plan.videoSize,
        chunk_size: plan.chunkSize,
        total_chunk_count: plan.totalChunkCount,
      },
    });
  } catch (err) {
    await logAttempt(svc, item, 'init',
      `init failed: ${err.message}`, item.publish_id,
      { httpStatus: err.httpStatus ?? null, tiktokErrorCode: err.code ?? null });
    await failItem(svc, item, `init:${err.code || `http_${err.httpStatus}`}`, 'init');
    summary.failed++;
    return;
  }
  const publishId = init.publish_id;
  const uploadUrl = init.upload_url;
  if (!publishId || !uploadUrl) {
    await failItem(svc, item, 'init:invalid_init_response', 'init');
    summary.failed++;
    return;
  }
  // Crash rule (plan §3.6 step 4): persist the publish_id and the
  // attempt row BEFORE any chunk is sent.
  await svc.update('queue_items', { publish_id: publishId, publish_phase: 'uploading' },
    eq('id', item.id));
  await logAttempt(svc, { ...item, publish_id: publishId }, 'init',
    `direct post initialised (privacy ${privacy.privacyLevel}${privacy.forced ? ', forced SELF_ONLY — client unaudited' : ''}; ${plan.totalChunkCount} chunk(s) of up to ${plan.chunkSize} bytes)`,
    publishId, { httpStatus: 200 });
  const liveItem = { ...item, publish_id: publishId };

  // Step 4 — chunks.
  try {
    await uploadChunks(env, liveItem, plan, uploadUrl);
  } catch (err) {
    await logAttempt(svc, liveItem, 'chunk',
      `chunk upload failed: ${err.message}`, publishId,
      { httpStatus: err.httpStatus ?? null, tiktokErrorCode: err.code ?? null });
    await failItem(svc, liveItem, `chunk:${err.code || `http_${err.httpStatus}`}`, 'chunk');
    summary.failed++;
    return;
  }
  await logAttempt(svc, liveItem, 'chunk',
    `uploaded ${plan.totalChunkCount} chunk(s), ${plan.videoSize} bytes`, publishId,
    { httpStatus: 201 });
  await svc.update('queue_items', { publish_phase: 'processing' }, eq('id', item.id));

  // Step 5 — bounded in-run polling; still-processing items stay in
  // 'publishing' and are settled by later ticks' status pass.
  const outcome = await pollPublishStatus(svc, liveItem, accessToken, {
    attempts: STATUS_POLL_ATTEMPTS,
    delaysMs: STATUS_POLL_DELAYS_MS,
  });
  if (outcome === 'published') summary.settled++;
  else if (outcome === 'failed') summary.failed++;
  else summary.processingStarted++;
}

async function publishOne(svc, env, item, mock, summary) {
  // Account gate (plan §3.3 step 1 / §2.2): never attempt a post from an
  // account that is not connected.
  const account = await svc.selectOne(
    'tiktok_accounts',
    `${eq('id', item.tiktok_account_id)}&select=id,status`,
  );
  if (!account || account.status !== 'connected') {
    await failItem(svc, item, account ? `account_${account.status}` : 'account_missing');
    summary.failed++;
    return;
  }

  // Daily cap (plan §3.4): count today's published items for this account.
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const publishedToday = await svc.select(
    'queue_items',
    `${eq('tiktok_account_id', account.id)}&${eq('status', 'published')}` +
      `&${gte('published_at', dayStart.toISOString())}&select=id`,
  ).catch(() => []);
  if (Array.isArray(publishedToday) && publishedToday.length >= DAILY_CAP) {
    await failItem(svc, item, 'daily_cap_reached');
    summary.failed++;
    return;
  }

  if (!mock) {
    await publishOneReal(svc, env, item, summary);
    return;
  }

  // ============================ MOCK PUBLISHER ===========================
  // Crash rule first (plan §3.6 step 4): persist the publish_id and the
  // attempt row BEFORE any "chunks" are sent.
  const publishId = `mock_pub_${item.id}`;
  await svc.update('queue_items', { publish_id: publishId }, eq('id', item.id));
  await logAttempt(svc, { ...item, publish_id: publishId }, 'init',
    'mock: Content Posting init (simulated)', publishId);
  await logAttempt(svc, { ...item, publish_id: publishId }, 'chunk',
    'mock: FILE_UPLOAD chunks sent (simulated)', publishId);
  await svc.update('queue_items', { publish_phase: 'processing' }, eq('id', item.id));
  summary.processingStarted++;
  // The item now sits in publishing/processing; the NEXT tick's status
  // pass settles it — the simulated processing delay (plan §4, Phase 0).
  // ========================== /MOCK PUBLISHER ============================
}

export async function onRequestPost({ request, env }) {
  const presented =
    request.headers.get('x-dispatch-secret') ||
    (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!env.DISPATCH_SECRET || !presented || !timingSafeEqual(presented, env.DISPATCH_SECRET)) {
    return json({ error: 'not_found' }, 404); // plan §3.6: 404, not 401
  }
  if (!hasServiceRole(env)) {
    return json({ error: 'service_role_not_configured' }, 503);
  }

  const svc = supabaseService(env);
  const mock = isMockMode(env);
  const now = new Date();
  const nowIso = now.toISOString();
  const summary = {
    mode: mock ? 'mock' : 'real',
    statesExpired: 0,
    settled: 0,
    pendingRealStatus: 0,
    leasesAdopted: 0,
    claimed: 0,
    processingStarted: 0,
    failed: 0,
  };

  // 1. Housekeeping (plan §3.6 step 1): expire stale oauth_states.
  //    Token refresh is lazy — it happens inside the publish/status
  //    paths when a token is actually needed (plan §1.4a, freshAccessToken).
  //    The proactive sweep (plan §1.4b) and stale-draft R2 cleanup
  //    (plan §3.6 step 1) remain future housekeeping additions.
  const expired = await svc.remove('oauth_states', lt('expires_at', nowIso)).catch(() => []);
  summary.statesExpired = Array.isArray(expired) ? expired.length : 0;

  // 2. Status pass (plan §3.6 step 2): settle processing items. In real
  //    mode each item is polled ONCE against its persisted publish_id —
  //    polling never re-uploads.
  const processing = await svc.select(
    'queue_items',
    `${eq('status', 'publishing')}&${eq('publish_phase', 'processing')}&select=*&limit=20`,
  ).catch(() => []);
  for (const item of processing ?? []) {
    if (mock) {
      await logAttempt(svc, item, 'status', 'mock: PUBLISH_COMPLETE (simulated processing)');
      await svc.update('queue_items', {
        status: 'published',
        publish_phase: null,
        published_at: nowIso,
        locked_at: null,
        locked_by: null,
      }, `${eq('id', item.id)}&${eq('status', 'publishing')}`);
      summary.settled++;
      continue;
    }
    if (!item.publish_id) {
      // A real item in processing without a publish_id cannot be
      // polled; leave it — lease adoption below only re-runs items
      // that never reached TikTok, and this one's phase says it did.
      summary.pendingRealStatus++;
      continue;
    }
    let accessToken;
    try {
      accessToken = await freshAccessToken(svc, env, item);
    } catch (err) {
      await failItem(svc, item, err.code || 'token_unavailable', 'refresh');
      summary.failed++;
      continue;
    }
    const outcome = await pollPublishStatus(svc, item, accessToken, {
      attempts: 1,
      delaysMs: [0],
    });
    if (outcome === 'published') summary.settled++;
    else if (outcome === 'failed') summary.failed++;
    else summary.pendingRealStatus++;
  }

  // 2b. Lease adoption (plan §3.6 step 4 crash rule): items stuck in
  // publishing/init or publishing/uploading past the lease were
  // interrupted mid-publish.
  const staleBefore = new Date(now.getTime() - LEASE_STALE_MS).toISOString();
  const stale = await svc.select(
    'queue_items',
    `${eq('status', 'publishing')}&publish_phase=in.(init,uploading)&${lt('locked_at', staleBefore)}&select=*&limit=5`,
  ).catch(() => []);
  for (const item of stale ?? []) {
    summary.leasesAdopted++;
    if (item.publish_id) {
      // Init already reached TikTok. The upload_url was never persisted
      // (no schema column), so remaining chunks cannot be resumed —
      // hand the item to the status pass instead: TikTok settles an
      // incomplete upload to FAILED on its own, and a completed one to
      // PUBLISH_COMPLETE. Either way the outcome is honest, and the
      // video is never posted twice.
      await svc.update('queue_items', { publish_phase: 'processing', locked_at: nowIso },
        eq('id', item.id));
    } else {
      // Nothing ever reached TikTok: re-running the publish pass is safe.
      await publishOne(svc, env, item, mock, summary);
    }
  }

  // 3. Claim pass (plan §3.6 step 3): atomically claim due items.
  //    PostgREST has no SKIP LOCKED, so the claim is a conditional update
  //    (status must still be 'scheduled'); a lost race returns no row.
  const due = await svc.select(
    'queue_items',
    `${eq('status', 'scheduled')}&${lte('scheduled_at', nowIso)}&select=*&order=scheduled_at.asc&limit=${CLAIM_LIMIT}`,
  ).catch(() => []);
  const claimedItems = [];
  for (const item of due ?? []) {
    const rows = await svc.update('queue_items', {
      status: 'publishing',
      publish_phase: 'init',
      locked_at: nowIso,
      locked_by: 'dispatcher',
      attempts: (item.attempts ?? 0) + 1,
    }, `${eq('id', item.id)}&${eq('status', 'scheduled')}`).catch(() => []);
    if (Array.isArray(rows) && rows.length) {
      claimedItems.push(rows[0]);
      summary.claimed++;
    }
  }

  // 4. Publish pass (plan §3.6 step 4).
  for (const item of claimedItems) {
    await publishOne(svc, env, item, mock, summary);
  }

  return json(summary);
}
