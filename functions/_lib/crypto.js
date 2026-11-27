// _lib/crypto.js — AES-256-GCM encryption for TikTok token columns.
// Plan: IMPLEMENTATION-PLAN.md §1.3. Stored format: v1.<iv_base64>.<ct_base64>
// The 32-byte key comes from the TOKEN_ENC_KEY Pages secret (base64).
// TOKEN_ENCRYPTION_KEY (the name used in the plan's secrets inventory) is
// accepted as a fallback alias so either name works at deploy time.
// WebCrypto only — no dependencies. Runs in Pages Functions and in Node ≥19
// (tests) unchanged.

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64_ALPHABET[a >> 2];
    out += B64_ALPHABET[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? B64_ALPHABET[((b & 15) << 2) | (c >> 6)] : '=';
    out += i + 2 < bytes.length ? B64_ALPHABET[c & 63] : '=';
  }
  return out;
}

export function base64ToBytes(b64) {
  const clean = String(b64).replace(/[^A-Za-z0-9+/=]/g, '');
  const out = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64_ALPHABET.indexOf(clean[i]);
    const c1 = B64_ALPHABET.indexOf(clean[i + 1]);
    const c2 = clean[i + 2] === '=' ? -1 : B64_ALPHABET.indexOf(clean[i + 2]);
    const c3 = clean[i + 3] === '=' ? -1 : B64_ALPHABET.indexOf(clean[i + 3]);
    out.push((c0 << 2) | (c1 >> 4));
    if (c2 !== -1) out.push(((c1 & 15) << 4) | (c2 >> 2));
    if (c3 !== -1) out.push(((c2 & 3) << 6) | c3);
  }
  return new Uint8Array(out);
}

const keyCache = new Map();

async function importKey(env) {
  const raw = env.TOKEN_ENC_KEY || env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('TOKEN_ENC_KEY is not set (32-byte base64 AES key required)');
  }
  if (keyCache.has(raw)) return keyCache.get(raw);
  const keyBytes = base64ToBytes(raw);
  if (keyBytes.length !== 32) {
    throw new Error(`TOKEN_ENC_KEY must decode to exactly 32 bytes (got ${keyBytes.length})`);
  }
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
  keyCache.set(raw, key);
  return key;
}

/** Encrypt a token string -> "v1.<iv_base64>.<ciphertext_base64>" */
export async function encryptToken(env, plaintext) {
  const key = await importKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(String(plaintext));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ct))}`;
}

/** Decrypt a stored "v1.<iv>.<ct>" value back to the token string. */
export async function decryptToken(env, stored) {
  const parts = String(stored).split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') {
    throw new Error('Unrecognised encrypted-token format (expected v1.<iv>.<ct>)');
  }
  const key = await importKey(env);
  const iv = base64ToBytes(parts[1]);
  const ct = base64ToBytes(parts[2]);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}
