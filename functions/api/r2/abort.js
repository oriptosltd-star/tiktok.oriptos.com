// POST /api/r2/abort — abort an in-progress multipart upload.
// Plan: IMPLEMENTATION-PLAN.md §3.1 (multipart plan includes an abort
// endpoint). The draft queue item is left in place so the user can retry;
// stale drafts are the dispatcher's housekeeping job (plan §3.6).
// Body: { queueItemId, key, uploadId }

import { supabaseForUser, eq } from '../../_lib/supabase.js';
import { requireUser, json, jsonError, HttpError } from '../../_lib/guard.js';
import { hasR2Config, abortMultipartUpload } from '../../_lib/r2.js';

export async function onRequestPost({ request, env }) {
  try {
    const { user, token } = await requireUser(request, env);
    if (!hasR2Config(env)) {
      throw new HttpError(503, 'storage_not_configured', 'R2 credentials are not set');
    }
    const body = await request.json().catch(() => ({}));
    if (!body.queueItemId || !body.key || !body.uploadId) {
      throw new HttpError(400, 'bad_request', 'queueItemId, key and uploadId are required');
    }
    const db = supabaseForUser(env, token);
    const item = await db.selectOne(
      'queue_items',
      `${eq('id', body.queueItemId)}&${eq('user_id', user.id)}&select=id,r2_key`,
    );
    if (!item) throw new HttpError(404, 'not_found', 'Queue item not found');
    if (item.r2_key !== body.key) {
      throw new HttpError(400, 'key_mismatch', 'key does not match the queue item');
    }
    await abortMultipartUpload(env, body.key, body.uploadId);
    return json({ itemId: item.id, aborted: true });
  } catch (err) {
    return jsonError(err);
  }
}
