// _lib/r2.js — Cloudflare R2 access via the S3 API, AWS SigV4 signed by hand
// (WebCrypto only, no dependencies). Plan: IMPLEMENTATION-PLAN.md §3.1.
// Credentials live ONLY in Pages secrets (R2_ACCESS_KEY_ID /
// R2_SECRET_ACCESS_KEY) and are used server-side to mint short-lived
// presigned URLs; the browser uploads directly to R2 with those URLs and
// never sees a key. Bucket defaults to the owner's bucket name.

export const DEFAULT_BUCKET = 'oriptos-broadcast-media';
const REGION = 'auto'; // R2's SigV4 region name
const SERVICE = 's3';

export function r2Config(env) {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 is not configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)');
  }
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket: env.R2_BUCKET || DEFAULT_BUCKET,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  };
}

export function hasR2Config(env) {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY);
}

// ---------------------------------------------------------------------------
// SigV4 primitives
// ---------------------------------------------------------------------------

function hex(bytes) {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(data) {
  const buf = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return hex(await crypto.subtle.digest('SHA-256', buf));
}

async function hmac(keyBytes, data) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
}

async function signingKey(secret, dateStamp) {
  const kDate = await hmac(new TextEncoder().encode(`AWS4${secret}`), dateStamp);
  const kRegion = await hmac(kDate, REGION);
  const kService = await hmac(kRegion, SERVICE);
  return hmac(kService, 'aws4_request');
}

function amzDates(now) {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

/** RFC 3986 encoding for canonical query strings. */
function strictEncode(value) {
  return encodeURIComponent(String(value)).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function canonicalQueryString(params) {
  return Object.keys(params)
    .sort()
    .map((k) => `${strictEncode(k)}=${strictEncode(params[k])}`)
    .join('&');
}

/** Encode an object key for a URL path (keep '/' separators). */
function encodeKey(key) {
  return key.split('/').map((seg) => encodeURIComponent(seg)).join('/');
}

function credentialScope(dateStamp) {
  return `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
}

// ---------------------------------------------------------------------------
// Presigned URLs (browser-facing)
// ---------------------------------------------------------------------------

/**
 * Presign a request. `extraQuery` params (e.g. partNumber/uploadId for
 * multipart) are part of the signed canonical query string.
 * `now` is injectable for tests.
 */
export async function presignUrl(env, { method, key, extraQuery = {}, expiresIn = 3600, now = new Date() }) {
  const cfg = r2Config(env);
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const { amzDate, dateStamp } = amzDates(now);
  const query = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${cfg.accessKeyId}/${credentialScope(dateStamp)}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': 'host',
    ...extraQuery,
  };
  const canonicalUri = `/${cfg.bucket}/${encodeKey(key)}`;
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString(query),
    `host:${host}\n`,
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope(dateStamp),
    await sha256Hex(canonicalRequest),
  ].join('\n');
  const kSigning = await signingKey(cfg.secretAccessKey, dateStamp);
  const signature = hex(await hmac(kSigning, stringToSign));
  return `${cfg.endpoint}${canonicalUri}?${canonicalQueryString(query)}&X-Amz-Signature=${signature}`;
}

/** Presigned PUT URL for a single-shot browser upload (plan §3.1, ≤100 MB). */
export function presignPut(env, key, { expiresIn = 3600, now } = {}) {
  return presignUrl(env, { method: 'PUT', key, expiresIn, now });
}

/**
 * Presigned GET URL for a server-side download. Used by the dispatcher
 * (plan §3.3 step 4) to read a queue item's video back out of R2 in
 * Range slices while uploading chunks to TikTok. Server-side only —
 * the URL is never sent to a browser. Only the host header is signed,
 * so callers may add an unsigned Range header to the fetch.
 */
export function presignGet(env, key, { expiresIn = 3600, now } = {}) {
  return presignUrl(env, { method: 'GET', key, expiresIn, now });
}

/** Presigned PUT URL for one multipart part. */
export function presignPart(env, key, uploadId, partNumber, { expiresIn = 3600, now } = {}) {
  return presignUrl(env, {
    method: 'PUT',
    key,
    extraQuery: { partNumber: String(partNumber), uploadId },
    expiresIn,
    now,
  });
}

// ---------------------------------------------------------------------------
// Header-signed requests (server-side only: multipart control, HEAD, DELETE)
// ---------------------------------------------------------------------------

async function signedFetch(env, { method, key, query = {}, body, contentType }) {
  const cfg = r2Config(env);
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const { amzDate, dateStamp } = amzDates(new Date());
  const payloadHash = await sha256Hex(body ?? '');
  const qs = canonicalQueryString(query);
  const url = `${cfg.endpoint}/${cfg.bucket}/${encodeKey(key)}${qs ? `?${qs}` : ''}`;
  const headersToSign = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    ...(contentType ? { 'content-type': contentType } : {}),
  };
  const signedHeaderNames = Object.keys(headersToSign).sort();
  const canonicalHeaders = signedHeaderNames.map((n) => `${n}:${headersToSign[n]}\n`).join('');
  const canonicalRequest = [
    method,
    `/${cfg.bucket}/${encodeKey(key)}`,
    qs,
    canonicalHeaders,
    signedHeaderNames.join(';'),
    payloadHash,
  ].join('\n');
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope(dateStamp),
    await sha256Hex(canonicalRequest),
  ].join('\n');
  const kSigning = await signingKey(cfg.secretAccessKey, dateStamp);
  const signature = hex(await hmac(kSigning, stringToSign));
  const res = await fetch(url, {
    method,
    headers: {
      ...headersToSign,
      Authorization:
        `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope(dateStamp)}, ` +
        `SignedHeaders=${signedHeaderNames.join(';')}, Signature=${signature}`,
    },
    body: body === undefined || body === '' ? undefined : body,
  });
  return res;
}

function xmlField(xml, field) {
  const m = String(xml).match(new RegExp(`<${field}>([^<]+)</${field}>`));
  return m ? m[1] : null;
}

/** Create a multipart upload; returns the S3 uploadId. */
export async function createMultipartUpload(env, key, contentType) {
  const res = await signedFetch(env, {
    method: 'POST',
    key,
    query: { uploads: '' },
    contentType,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`R2 CreateMultipartUpload failed (${res.status}): ${text.slice(0, 200)}`);
  const uploadId = xmlField(text, 'UploadId');
  if (!uploadId) throw new Error('R2 CreateMultipartUpload returned no UploadId');
  return uploadId;
}

/** Complete a multipart upload with [{ partNumber, etag }] collected by the browser. */
export async function completeMultipartUpload(env, key, uploadId, parts) {
  const body =
    '<CompleteMultipartUpload>' +
    parts
      .slice()
      .sort((a, b) => a.partNumber - b.partNumber)
      .map((p) => `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${p.etag}</ETag></Part>`)
      .join('') +
    '</CompleteMultipartUpload>';
  const res = await signedFetch(env, {
    method: 'POST',
    key,
    query: { uploadId },
    body,
    contentType: 'application/xml',
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`R2 CompleteMultipartUpload failed (${res.status}): ${text.slice(0, 200)}`);
  return text;
}

/** Abort a multipart upload (cleanup path). */
export async function abortMultipartUpload(env, key, uploadId) {
  const res = await signedFetch(env, { method: 'DELETE', key, query: { uploadId } });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => '');
    throw new Error(`R2 AbortMultipartUpload failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

/** HEAD an object; returns { size, contentType } or null when absent. */
export async function headObject(env, key) {
  const res = await signedFetch(env, { method: 'HEAD', key });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 HEAD failed (${res.status})`);
  return {
    size: Number(res.headers.get('Content-Length') || 0),
    contentType: res.headers.get('Content-Type'),
  };
}

/** DELETE an object (queue-item deletion path). Missing object is fine. */
export async function deleteObject(env, key) {
  const res = await signedFetch(env, { method: 'DELETE', key });
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 DELETE failed (${res.status})`);
  }
}

/** Object key for a user's queue item (plan §3.1): users/<user_id>/<item_id>/<file> */
export function objectKeyFor(userId, itemId, fileName) {
  const safe = String(fileName || 'video.mp4')
    .split(/[\\/]/)
    .pop()
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .slice(0, 120) || 'video.mp4';
  return `users/${userId}/${itemId}/${safe}`;
}
