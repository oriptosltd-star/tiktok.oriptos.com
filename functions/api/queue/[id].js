// /api/queue/:id — update/schedule or delete one of the caller's items.
// Plan: IMPLEMENTATION-PLAN.md §2.2 (transitions), §2.4 (PATCH step of the
// schedule flow). PATCH whitelists the user-owned fields and enforces the
// client side of the state machine; DELETE removes the row and makes a
// best-effort attempt to delete the R2 object (plan §3.1 garbage rule is
// the dispatcher's job — this is just the user's own delete).

import { supabaseForUser, eq } from '../../_lib/supabase.js';
import { requireUser, json, jsonError, HttpError } from '../../_lib/guard.js';
import { canTransition, isServerOnlyStatus } from '../../_lib/stateMachine.js';
import { hasR2Config, deleteObject } from '../../_lib/r2.js';

const PATCH_FIELDS = [
  'caption', 'tiktok_account_id', 'privacy_level', 'allow_comment',
  'allow_duet', 'allow_stitch', 'is_commercial_content',
  'commercial_content_type', 'scheduled_at', 'timezone', 'status',
];

const DELETABLE = ['draft', 'uploaded', 'scheduled', 'cancelled', 'failed'];

export async function onRequestPatch({ request, env, params }) {
  try {
    const { user, token } = await requireUser(request, env);
    const db = supabaseForUser(env, token);
    const item = await db.selectOne(
      'queue_items',
      `${eq('id', params.id)}&${eq('user_id', user.id)}&select=id,status,scheduled_at`,
    );
    if (!item) throw new HttpError(404, 'not_found', 'Queue item not found');

    const body = await request.json().catch(() => ({}));
    const patch = {};
    for (const f of PATCH_FIELDS) if (body[f] !== undefined) patch[f] = body[f];
    if (Object.keys(patch).length === 0) {
      throw new HttpError(400, 'bad_request', 'No updatable fields provided');
    }

    if (patch.status !== undefined && patch.status !== item.status) {
      if (isServerOnlyStatus(patch.status)) {
        throw new HttpError(403, 'server_owned_status',
          `Status ${patch.status} is written by the dispatcher only`);
      }
      if (!canTransition(item.status, patch.status, 'client')) {
        throw new HttpError(409, 'bad_transition',
          `Cannot move an item from ${item.status} to ${patch.status}`);
      }
    }
    const resultingStatus = patch.status ?? item.status;
    const resultingSchedule = patch.scheduled_at ?? item.scheduled_at;
    if (resultingStatus === 'scheduled' && !resultingSchedule) {
      throw new HttpError(400, 'bad_request', 'scheduled_at is required to schedule an item');
    }

    const [updated] = await db.update(
      'queue_items',
      patch,
      `${eq('id', item.id)}&${eq('status', item.status)}`,
    );
    if (!updated) throw new HttpError(409, 'conflict', 'Item changed while updating; retry');
    return json({ item: updated });
  } catch (err) {
    return jsonError(err);
  }
}

export async function onRequestDelete({ request, env, params }) {
  try {
    const { user, token } = await requireUser(request, env);
    const db = supabaseForUser(env, token);
    const item = await db.selectOne(
      'queue_items',
      `${eq('id', params.id)}&${eq('user_id', user.id)}&select=id,status,r2_key`,
    );
    if (!item) throw new HttpError(404, 'not_found', 'Queue item not found');
    if (!DELETABLE.includes(item.status)) {
      throw new HttpError(409, 'not_deletable', `A ${item.status} item cannot be deleted`);
    }
    await db.remove('queue_items', eq('id', item.id));
    if (hasR2Config(env) && item.r2_key) {
      // Best-effort: a leftover object is untidy, not incorrect — the
      // dispatcher also sweeps stale media (plan §3.6 housekeeping).
      await deleteObject(env, item.r2_key).catch(() => {});
    }
    return json({ deleted: true, id: item.id });
  } catch (err) {
    return jsonError(err);
  }
}
