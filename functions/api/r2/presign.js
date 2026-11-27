// POST /api/r2/presign — mint browser-direct R2 upload URLs.
// Plan: IMPLEMENTATION-PLAN.md §3.1. The Function creates the queue_items
// row as `draft` first (so the item id exists and the object key can embed
// it), then returns:
//   fileSize ≤ 100 MB : { mode: 'single', putUrl }
//   fileSize > 100 MB : { mode: 'multipart', uploadId, partSize, parts:
//                         [{ partNumber, url }], completeEndpoint, abortEndpoint }
// The browser uploads straight to R2 with these URLs and then calls
// /api/r2/complete (or /api/r2/abort). All signing is server-side; the R2
// secret never leaves this Function (plan §3.1).
//
// Body: { fileName, fileSize, mimeType, tiktokAccountId?, queueItemId? }
// - queueItemId given  -> reuse that draft (ownership checked under RLS)
// - otherwise          -> tiktokAccountId is required to create the draft
// R2 credentials are NOT part of mock mode: without them this returns 503.

import { supabaseForUser, eq } from '../../_lib/supabase.js';
import { requireUser, json, jsonError, HttpError } from '../../_lib/guard.js';
import {
  hasR2Config,
  r2Config,
  presignPut,
  presignPart,
  createMultipartUpload,
  objectKeyFor,
} from '../../_lib/r2.js';

const SINGLE_PUT_MAX = 100 * 1024 * 1024; // plan §3.1
const PART_SIZE = 50 * 1024 * 1024; // plan §3.1: 50 MB parts
const MAX_PARTS = 1000;

export async function onRequestPost({ request, env }) {
  try {
    const { user, token } = await requireUser(request, env);
    if (!hasR2Config(env)) {
      throw new HttpError(503, 'storage_not_configured', 'R2 credentials are not set');
    }
    const body = await request.json().catch(() => ({}));
    const fileName = String(body.fileName || '').trim();
    const fileSize = Number(body.fileSize);
    const mimeType = String(body.mimeType || 'video/mp4');
    if (!fileName || !Number.isFinite(fileSize) || fileSize <= 0) {
      throw new HttpError(400, 'bad_request', 'fileName and a positive fileSize are required');
    }

    const db = supabaseForUser(env, token);
    const bucket = r2Config(env).bucket;

    // Resolve (or create) the draft queue item this upload belongs to.
    let item;
    if (body.queueItemId) {
      item = await db.selectOne(
        'queue_items',
        `${eq('id', body.queueItemId)}&${eq('user_id', user.id)}&select=id,r2_key`,
      );
      if (!item) throw new HttpError(404, 'not_found', 'Queue item not found');
    } else {
      if (!body.tiktokAccountId) {
        throw new HttpError(400, 'bad_request',
          'tiktokAccountId is required when creating a new draft');
      }
      // Two-step: insert with a provisional key, then set the final key
      // (which embeds the item id) — both under RLS as the owner.
      const [created] = await db.insert('queue_items', {
        user_id: user.id,
        tiktok_account_id: body.tiktokAccountId,
        caption: '',
        r2_bucket: bucket,
        r2_key: `users/${user.id}/pending/${Date.now()}`,
        file_name: fileName,
        file_size_bytes: fileSize,
        mime_type: mimeType,
        status: 'draft',
      });
      item = created;
      const key = objectKeyFor(user.id, item.id, fileName);
      await db.update('queue_items', { r2_key: key }, eq('id', item.id));
      item = { ...item, r2_key: key };
    }

    const key = item.r2_key;

    if (fileSize <= SINGLE_PUT_MAX) {
      const putUrl = await presignPut(env, key, { expiresIn: 3600 });
      return json({ itemId: item.id, key, mode: 'single', putUrl, expiresIn: 3600 });
    }

    const partCount = Math.ceil(fileSize / PART_SIZE);
    if (partCount > MAX_PARTS) {
      throw new HttpError(413, 'file_too_large', `File would need ${partCount} parts (max ${MAX_PARTS})`);
    }
    const uploadId = await createMultipartUpload(env, key, mimeType);
    const parts = [];
    for (let n = 1; n <= partCount; n++) {
      parts.push({ partNumber: n, url: await presignPart(env, key, uploadId, n, { expiresIn: 3600 }) });
    }
    return json({
      itemId: item.id,
      key,
      mode: 'multipart',
      uploadId,
      partSize: PART_SIZE,
      parts,
      completeEndpoint: '/api/r2/complete',
      abortEndpoint: '/api/r2/abort',
    });
  } catch (err) {
    return jsonError(err);
  }
}
