// _lib/stateMachine.js — the queue_items state machine.
// Plan: IMPLEMENTATION-PLAN.md §2.2 (diagram + rules) and §2.3 (only the
// dispatcher/service role may write 'publishing', 'published', publish_id).
//
//   draft ──(upload verified)──► uploaded ──(date/time + privacy set)──► scheduled
//     │                            │                                        │
//     └──(delete: row removed)     └──(cancel)──► cancelled                 ├─(dispatcher claims)─► publishing ─► published
//                                                                            │                            └─────► failed
//   failed ──(user edits + reschedules)──► scheduled                         └─(account gone)─► failed
//
// Same-status "transitions" (editing fields without changing status) are
// allowed for client-editable statuses and handled by callers, not here.

export const QUEUE_STATUSES = [
  'draft',
  'uploaded',
  'scheduled',
  'publishing',
  'published',
  'failed',
  'cancelled',
];

// Statuses a browser client (publishable key + user JWT, under RLS) may move
// an item INTO via insert/update. Mirrors the schema.sql RLS WITH CHECK list.
export const CLIENT_WRITABLE_STATUSES = ['draft', 'uploaded', 'scheduled', 'cancelled'];

const CLIENT_TRANSITIONS = {
  draft: ['uploaded', 'cancelled'],
  uploaded: ['scheduled', 'cancelled'],
  scheduled: ['cancelled'],
  failed: ['scheduled', 'cancelled'],
  publishing: [],
  published: [],
  cancelled: [],
};

// The dispatcher (service role) owns the publish lifecycle.
const DISPATCHER_TRANSITIONS = {
  draft: [],
  uploaded: [],
  scheduled: ['publishing', 'failed', 'cancelled'],
  publishing: ['published', 'failed'],
  published: [],
  failed: [],
  cancelled: [],
};

export function canTransition(from, to, actor) {
  const table = actor === 'client' ? CLIENT_TRANSITIONS : DISPATCHER_TRANSITIONS;
  if (!table || !Object.prototype.hasOwnProperty.call(table, from)) return false;
  return table[from].includes(to);
}

export function isServerOnlyStatus(status) {
  return status === 'publishing' || status === 'published';
}
