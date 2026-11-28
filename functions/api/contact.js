// POST /api/contact — Contact Us form submissions (public, no session).
// Validates the payload server-side, drops honeypot submissions while
// pretending success, applies a best-effort per-email rate limit, and
// stores the message in public.contact_messages via the service-role
// client (the table has RLS on and no public policies — see
// ~/workspace/tiktok-build/contact-messages.sql; until that SQL is run
// once in the Supabase SQL Editor, inserts fail and this endpoint
// returns a storage error).
//
// Message bodies are never logged.

import { supabaseService, eq } from '../_lib/supabase.js';
import { json } from '../_lib/guard.js';

export const CONTACT_SUBJECTS = ['General', 'Support', 'Business', 'Privacy'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RATE_LIMIT_MAX = 5; // messages per email per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/**
 * Pure validation/normalisation for a contact payload. Returns
 * { ok: true, value: { name, email, subject, message } } with trimmed
 * fields (email lowercased), or { ok: false, error } with a stable
 * machine-readable code. Exported for the offline tests.
 */
export function validateContactPayload(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'invalid_payload' };
  }
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name || name.length > 100) return { ok: false, error: 'invalid_name' };

  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!email || email.length > 200 || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'invalid_email' };
  }

  const subject = typeof input.subject === 'string' ? input.subject : '';
  if (!CONTACT_SUBJECTS.includes(subject)) return { ok: false, error: 'invalid_subject' };

  const message = typeof input.message === 'string' ? input.message.trim() : '';
  if (message.length < 10 || message.length > 5000) {
    return { ok: false, error: 'invalid_message' };
  }

  return { ok: true, value: { name, email, subject, message } };
}

/**
 * The form carries a hidden "company" field that humans never see or
 * fill. Any content in it means a bot — the handler pretends success
 * and stores nothing.
 */
export function isHoneypotTripped(input) {
  return Boolean(
    input && typeof input.company === 'string' && input.company.length > 0,
  );
}

export async function onRequestPost({ request, env }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json(
      { error: 'not_configured', message: 'The contact form is not configured yet.' },
      503,
    );
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: 'invalid_json', message: 'Request body must be JSON.' }, 400);
  }

  // Honeypot: pretend success, store nothing, never reach the database.
  if (isHoneypotTripped(input)) return json({ ok: true });

  const check = validateContactPayload(input);
  if (!check.ok) {
    return json({ error: check.error, message: 'Please check the form fields.' }, 400);
  }
  const { name, email, subject, message } = check.value;

  const db = supabaseService(env);

  // Best-effort rate limit: at most RATE_LIMIT_MAX stored messages per
  // email per hour. Fail-open — if the count query errors, the message
  // is still accepted rather than lost.
  try {
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const recent = await db.select(
      'contact_messages',
      `${eq('email', email)}&created_at=gte.${encodeURIComponent(since)}&select=id&limit=10`,
    );
    if (Array.isArray(recent) && recent.length >= RATE_LIMIT_MAX) {
      return json(
        {
          error: 'rate_limited',
          message: 'You have sent several messages recently — please try again later, or email us directly.',
        },
        429,
      );
    }
  } catch {
    // Rate-limit check unavailable: fail open and still store the message.
  }

  try {
    await db.insert(
      'contact_messages',
      {
        name,
        email,
        subject,
        message,
        user_agent: (request.headers.get('user-agent') || '').slice(0, 512) || null,
      },
      { returning: false },
    );
  } catch {
    return json(
      {
        error: 'storage_error',
        message: 'Your message could not be saved right now. Please email us directly.',
      },
      500,
    );
  }

  return json({ ok: true });
}
