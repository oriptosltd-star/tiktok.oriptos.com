// _lib/supabase.js — minimal Supabase REST (PostgREST) + Auth client.
// Plan: IMPLEMENTATION-PLAN.md §1.2 (supabaseAdmin), §2.3 (RLS posture).
// Two modes, both plain fetch — no dependencies:
//   - anon + user JWT : the publishable key plus the caller's Supabase
//     access token. RLS does the ownership enforcement.
//   - service role    : SUPABASE_SERVICE_ROLE_KEY. Bypasses RLS. Server-only:
//     this mode must only ever be constructed inside Pages Functions.

function base(env) {
  const url = env.SUPABASE_URL;
  if (!url) throw new Error('SUPABASE_URL is not set');
  return url.replace(/\/+$/, '');
}

export class SupabaseError extends Error {
  constructor(status, body) {
    super(`Supabase request failed (${status}): ${typeof body === 'string' ? body.slice(0, 300) : JSON.stringify(body).slice(0, 300)}`);
    this.status = status;
    this.body = body;
  }
}

class SupabaseClient {
  constructor(env, apiKey, bearer) {
    this.root = base(env);
    this.apiKey = apiKey;
    this.bearer = bearer || apiKey;
  }

  async request(path, { method = 'GET', body, prefer, headers = {} } = {}) {
    const res = await fetch(`${this.root}/rest/v1/${path}`, {
      method,
      headers: {
        apikey: this.apiKey,
        Authorization: `Bearer ${this.bearer}`,
        'Content-Type': 'application/json',
        ...(prefer ? { Prefer: prefer } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let parsed = null;
    if (text) {
      try { parsed = JSON.parse(text); } catch { parsed = text; }
    }
    if (!res.ok) throw new SupabaseError(res.status, parsed ?? text);
    return parsed;
  }

  /** GET rows. `query` is a PostgREST query string (filters/order/select). */
  select(table, query = '') {
    return this.request(query ? `${table}?${query}` : table);
  }

  /** Convenience: first row of a select, or null. */
  async selectOne(table, query) {
    const rows = await this.select(table, query);
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }

  insert(table, rows, { returning = true } = {}) {
    return this.request(table, {
      method: 'POST',
      body: rows,
      prefer: returning ? 'return=representation' : 'return=minimal',
    });
  }

  /** Insert-or-merge on a unique constraint, returning the row(s). */
  upsert(table, rows, onConflict) {
    const q = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : '';
    return this.request(`${table}${q}`, {
      method: 'POST',
      body: rows,
      prefer: 'resolution=merge-duplicates,return=representation',
    });
  }

  /** PATCH rows matching a PostgREST filter query. Returns rows if asked. */
  update(table, patch, query, { returning = true } = {}) {
    return this.request(`${table}?${query}`, {
      method: 'PATCH',
      body: patch,
      prefer: returning ? 'return=representation' : 'return=minimal',
    });
  }

  remove(table, query) {
    return this.request(`${table}?${query}`, {
      method: 'DELETE',
      prefer: 'return=representation',
    });
  }
}

/** Publishable (anon) key + the caller's Supabase JWT. RLS applies. */
export function supabaseForUser(env, userJwt) {
  if (!env.SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY is not set');
  if (!userJwt) throw new Error('A user JWT is required for the anon client');
  return new SupabaseClient(env, env.SUPABASE_ANON_KEY, userJwt);
}

/** Service-role client. Bypasses RLS. Pages Functions only — never browser. */
export function supabaseService(env) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return new SupabaseClient(env, env.SUPABASE_SERVICE_ROLE_KEY, env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasServiceRole(env) {
  return Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Verify a Supabase access token and return the auth user
 * ({ id, email, ... }) or null. Plan §1.5: verify by calling
 * GET <SUPABASE_URL>/auth/v1/user with the token.
 */
export async function getAuthUser(env, userJwt) {
  if (!userJwt || !env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(`${base(env)}/auth/v1/user`, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${userJwt}`,
      },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user && user.id ? user : null;
  } catch {
    return null;
  }
}

/** Build a PostgREST eq-filter fragment with a safely encoded value. */
export function eq(column, value) {
  return `${column}=eq.${encodeURIComponent(String(value))}`;
}
