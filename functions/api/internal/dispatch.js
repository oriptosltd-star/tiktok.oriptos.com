// POST /api/internal/dispatch — the scheduler tick.
// Plan: IMPLEMENTATION-PLAN.md §3.5 (option a: a thin Cloudflare Cron
// Worker POSTs here every minute) and §3.6 (the dispatcher's tick order).
// Guarded by DISPATCH_SECRET: any caller without it gets a 404, not a
// 401 — the endpoint does not advertise itself (plan §3.6).
//
// Tick order (plan §3.6): housekeeping -> status pass -> claim pass ->
// publish pass. Publishing is a MOCK publisher while TikTok credentials
// are absent (mock mode, _lib/tiktok.js): claimed items get a mock
// publish_id, move to publish_phase='processing', and are settled to
// 'published' by the NEXT tick's status pass — the full state machine
// is exercised without TikTok. In real mode the publish pass is a
// clearly-marked TODO stub that fails items honestly rather than
// pretending to post (see publishOne below).

import { supabaseService, hasServiceRole, eq } from '../../../_lib/supabase.js';
import { json, timingSafeEqual } from '../../../_lib/guard.js';
import { isMockMode } from '../../../_lib/tiktok.js';

const CLAIM_LIMIT = 5; // plan §3.6 step 3 (N=5)
const LEASE_STALE_MS = 10 * 60 * 1000; // plan §3.6 crash rule: 10-minute lease
const DAILY_CAP = 15; // plan §3.4: per-creator cap, fail fast instead of burning an init

function lt(col, iso) { return `${col}=lt.${encodeURIComponent(iso)}`; }
function lte(col, iso) { return `${col}=lte.${encodeURIComponent(iso)}`; }
function gte(col, iso) { return `${col}=gte.${encodeURIComponent(iso)}`; }

async function logAttempt(svc, item, phase, detail, publishId = undefined) {
  await svc.insert('publish_attempts', {
    queue_item_id: item.id,
    publish_id: publishId ?? item.publish_id ?? null,
    phase,
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
    // ===================== REAL MODE — TODO STUB ========================
    // The real Content Posting sequence (plan §3.3) is:
    //   creator_info/query -> post/publish/video/init (store publish_id
    //   BEFORE any chunk — the crash rule) -> chunk PUTs from R2 ->
    //   status/fetch polling. It is deliberately NOT faked here: until it
    //   is implemented, a claimed item fails loudly with an actionable
    //   reason instead of being marked published without posting.
    await logAttempt(svc, item, 'init',
      'TODO: real Content Posting sequence not implemented in Phase 0 (plan §3.3)');
    await failItem(svc, item, 'real_publishing_not_implemented');
    summary.failed++;
    return;
    // =================== /REAL MODE — TODO STUB =========================
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
  //    (Token-refresh sweep and stale-draft R2 cleanup join here when the
  //    refresh helper lands — plan §1.4 / §3.6; not in Phase 0 scope.)
  const expired = await svc.remove('oauth_states', lt('expires_at', nowIso)).catch(() => []);
  summary.statesExpired = Array.isArray(expired) ? expired.length : 0;

  // 2. Status pass (plan §3.6 step 2): settle processing items.
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
    } else {
      // TODO (real mode): POST /v2/post/publish/status/fetch/ per item —
      // plan §3.3 step 5. Left untouched until implemented.
      summary.pendingRealStatus++;
    }
  }

  // 2b. Lease adoption (plan §3.6 step 4 crash rule): items stuck in
  // publishing/init past the lease were interrupted mid-publish.
  const staleBefore = new Date(now.getTime() - LEASE_STALE_MS).toISOString();
  const stale = await svc.select(
    'queue_items',
    `${eq('status', 'publishing')}&${eq('publish_phase', 'init')}&${lt('locked_at', staleBefore)}&select=*&limit=5`,
  ).catch(() => []);
  for (const item of stale ?? []) {
    summary.leasesAdopted++;
    if (item.publish_id) {
      // Init already reached TikTok: resume at the polling stage.
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
