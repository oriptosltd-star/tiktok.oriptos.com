// _lib/guard.js — site-session check + JSON response helpers.
// Plan: IMPLEMENTATION-PLAN.md §1.2 (_lib/auth.js + _lib/http.js, combined
// here per the build contract), §1.5 (session = Supabase Auth JWT, verified
// against the Supabase Auth user endpoint).

import { getAuthUser } from './supabase.js';

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

export function jsonError(err) {
  if (err instanceof HttpError) {
    return json({ error: err.code, message: err.message }, err.status);
  }
  return json(
    { error: 'internal_error', message: err && err.message ? err.message : 'Unexpected error' },
    500,
  );
}

export function redirect(location, extraHeaders = {}) {
  return new Response(null, {
    status: 302,
    headers: { Location: location, 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

export function bearerToken(request) {
  const h = request.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/**
 * Require a valid site session. The dashboard sends its Supabase access
 * token as `Authorization: Bearer <jwt>` on every Function call; we verify
 * it via the Supabase Auth user endpoint (plan §1.5). Returns the auth
 * user ({ id, email, ... }); throws HttpError(401) otherwise.
 */
export async function requireUser(request, env) {
  const token = bearerToken(request);
  if (!token) {
    throw new HttpError(401, 'unauthorized', 'Missing site session token');
  }
  const user = await getAuthUser(env, token);
  if (!user) {
    throw new HttpError(401, 'unauthorized', 'Site session is invalid or expired');
  }
  return { user, token };
}

/** Constant-time string compare (for the dispatch secret). */
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    // Still walk the longer input so length is the only timing signal.
    const n = Math.max(a?.length ?? 0, b?.length ?? 0);
    let diff = 1;
    for (let i = 0; i < n; i++) {
      diff |= (a?.charCodeAt(i) || 0) ^ (b?.charCodeAt(i) || 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** APP_BASE_URL without a trailing slash (defaults to the production site). */
export function appBaseUrl(env) {
  return (env.APP_BASE_URL || 'https://tiktok.oriptos.com').replace(/\/+$/, '');
}
