// /api/queue — the caller's video queue.
// Plan: IMPLEMENTATION-PLAN.md §2.4 (schedule modal flow), §2.3 (RLS).
//   GET  /api/queue            list own items (optional ?status= filter)
//   POST /api/queue            create an item (client-writable fields only)
// All access goes through the anon + user-JWT client, so RLS — not this
// code — is the ownership boundary; this layer validates shape and the
// state machine, and never lets a client write server-owned columns
// (the schema trigger is the backstop, plan §2.3).

import { supabaseForUser, eq } from '../../_lib/supabase.js';
import { requireUser, json, jsonError, HttpError } from '../../_lib/guard.js';
import { CLIENT_WRITABLE_STATUSES } from '../../_lib/stateMachine.js';
import { DEFAULT_BUCKET } from '../../_lib/r2.js';

const CREATE_FIELDS = [
  'tiktok_account_id', 'caption', 'r2_bucket', 'r2_key', 'file_name',
  'file_size_bytes', 'mime_type', 'duration_sec', 'privacy_level',
  'allow_comment', 'allow_duet', 'allow_stitch', 'is_commercial_content',
  'commercial_content_type', 'scheduled_at', 'timezone', 'status',
];

function pick(body, fields) {
  const out = {};
  for (const f of fields) if (body[f] !== undefined) out[f] = body[f];
  return out;
}

export async function onRequestGet({ request, env }) {
  try {
    const { user, token } = await requireUser(request, env);
    const db = supabaseForUser(env, token);
    const url = new URL(request.url);
    let query = `${eq('user_id', user.id)}&order=scheduled_at.asc,created_at.desc`;
    const status = url.searchParams.get('status');
    if (status) query += `&${eq('status', status)}`;
    const items = await db.select('queue_items', query);
    return json({ items: items ?? [] });
  } catch (err) {
    return jsonError(err);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const { user, token } = await requireUser(request, env);
    const body = await request.json().catch(() => ({}));
    const item = pick(body, CREATE_FIELDS);

    if (!item.tiktok_account_id) {
      throw new HttpError(400, 'bad_request', 'tiktok_account_id is required');
    }
    if (!item.r2_key || !item.file_name || !item.file_size_bytes || !item.mime_type) {
      throw new HttpError(400, 'bad_request',
        'r2_key, file_name, file_size_bytes and mime_type are required (upload via /api/r2/presign first)');
    }
    item.status = item.status ?? 'uploaded';
    if (!CLIENT_WRITABLE_STATUSES.includes(item.status)) {
      throw new HttpError(400, 'bad_status', `Clients cannot create an item in status ${item.status}`);
    }
    if (item.status === 'scheduled' && !item.scheduled_at) {
      throw new HttpError(400, 'bad_request', 'scheduled_at is required for a scheduled item');
    }
    item.r2_bucket = item.r2_bucket || env.R2_BUCKET || DEFAULT_BUCKET;
    item.user_id = user.id;

    const db = supabaseForUser(env, token);
    const [created] = await db.insert('queue_items', item);
    return json({ item: created }, 201);
  } catch (err) {
    return jsonError(err);
  }
}
