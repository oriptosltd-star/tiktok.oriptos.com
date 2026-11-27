// POST /api/r2/complete — finish an R2 upload and verify it.
// Plan: IMPLEMENTATION-PLAN.md §3.1 step 3: HEAD the object, check the
// byte count against queue_items.file_size_bytes, flip draft -> uploaded.
// Body (multipart): { queueItemId, key, uploadId, parts: [{partNumber, etag}] }
// Body (single PUT): { queueItemId, key }

import { supabaseForUser, eq } from '../../_lib/supabase.js';
import { requireUser, json, jsonError, HttpError } from '../../_lib/guard.js';
import { hasR2Config, completeMultipartUpload, headObject } from '../../_lib/r2.js';
import { canTransition } from '../../_lib/stateMachine.js';

export async function onRequestPost({ request, env }) {
  try {
    const { user, token } = await requireUser(request, env);
    if (!hasR2Config(env)) {
      throw new HttpError(503, 'storage_not_configured', 'R2 credentials are not set');
    }
    const body = await request.json().catch(() => ({}));
    if (!body.queueItemId || !body.key) {
      throw new HttpError(400, 'bad_request', 'queueItemId and key are required');
    }

    const db = supabaseForUser(env, token);
    const item = await db.selectOne(
      'queue_items',
      `${eq('id', body.queueItemId)}&${eq('user_id', user.id)}&select=id,status,r2_key,file_size_bytes`,
    );
    if (!item) throw new HttpError(404, 'not_found', 'Queue item not found');
    if (item.r2_key !== body.key) {
      throw new HttpError(400, 'key_mismatch', 'key does not match the queue item');
    }

    if (body.uploadId) {
      if (!Array.isArray(body.parts) || body.parts.length === 0) {
        throw new HttpError(400, 'bad_request', 'parts are required to complete a multipart upload');
      }
      await completeMultipartUpload(env, body.key, body.uploadId, body.parts);
    }

    const head = await headObject(env, body.key);
    if (!head) throw new HttpError(409, 'upload_missing', 'Uploaded object not found in R2');
    if (head.size !== Number(item.file_size_bytes)) {
      throw new HttpError(409, 'size_mismatch',
        `Uploaded size ${head.size} does not match expected ${item.file_size_bytes}`);
    }

    if (item.status === 'uploaded') {
      return json({ itemId: item.id, status: 'uploaded', size: head.size });
    }
    if (!canTransition(item.status, 'uploaded', 'client')) {
      throw new HttpError(409, 'bad_transition', `Cannot mark a ${item.status} item as uploaded`);
    }
    const [updated] = await db.update(
      'queue_items',
      { status: 'uploaded' },
      `${eq('id', item.id)}&${eq('status', item.status)}`,
    );
    return json({ itemId: item.id, status: updated?.status ?? 'uploaded', size: head.size });
  } catch (err) {
    return jsonError(err);
  }
}
