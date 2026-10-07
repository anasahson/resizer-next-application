/**
 * imgbb Image Hosting Service
 *
 * The single image host for this app: POST https://api.imgbb.com/1/upload
 * with multipart/form-data, returning a permanent CDN url (i.ibb.co).
 *
 * Must always be POST + multipart: a GET would URL-encode the base64 payload
 * and corrupt it (and is capped by URL length).
 *
 * Response shape (success): { data: { id, url, display_url, thumb, medium,
 * delete_url, ... }, success: true, status: 200 }
 * Response shape (failure): { status_code, error: { message, code } }
 *
 * Env (server-side only — never send the key to the browser):
 *   IMGBB_API_KEY     client API key from https://api.imgbb.com/user/api_key
 *   IMGBB_EXPIRATION  optional auto-delete seconds (60-15552000); 0/absent =
 *                     keep forever
 *   IMGBB_TIMEOUT_MS  optional per-request budget (default 30000)
 */

require('dotenv').config({
  path: require('path').join(__dirname, '..', '..', '.env'),
});

const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';
const IMGBB_MAX_BYTES = 32 * 1024 * 1024; // documented imgbb limit

class ImgbbServiceError extends Error {
  constructor(message, statusCode = 502, details = null) {
    super(message);
    this.name = 'ImgbbServiceError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function apiKey() {
  return (process.env.IMGBB_API_KEY || '').trim();
}

function expirationSeconds() {
  const parsed = parseInt(process.env.IMGBB_EXPIRATION || '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(Math.max(parsed, 60), 15552000);
}

function timeoutMs() {
  const parsed = parseInt(process.env.IMGBB_TIMEOUT_MS || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30000;
}

/** True once an API key is present. */
function isConfigured() {
  return apiKey().length > 0;
}

function requireConfig() {
  if (!isConfigured()) {
    throw new ImgbbServiceError(
      'Image hosting is not configured. Set IMGBB_API_KEY in backend/.env (get one from https://api.imgbb.com/user/api_key).',
      503,
    );
  }
}

/** The key travels in the query string, so scrub it from anything we surface. */
function redactKey(text) {
  const key = apiKey();
  let out = String(text ?? '');
  if (key) out = out.split(key).join('<redacted-imgbb-key>');
  return out.replace(/([?&]key=)[^&\s"']+/gi, '$1<redacted>');
}

/**
 * Upload an image buffer.
 *
 * @param {Object} options
 * @param {Buffer} options.fileBuffer - The processed image bytes
 * @param {string} [options.filename]  - Filename sent with the upload
 * @param {string} [options.name]      - Optional display name override
 */
async function uploadImage({ fileBuffer, filename, name }) {
  requireConfig();

  if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw new ImgbbServiceError('No image data to upload.', 400);
  }
  if (fileBuffer.length > IMGBB_MAX_BYTES) {
    throw new ImgbbServiceError(
      `Image is ${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB — imgbb accepts at most 32 MB.`,
      413,
    );
  }

  const form = new FormData();
  form.append('image', new Blob([fileBuffer]), filename || 'image.png');
  const expiration = expirationSeconds();
  if (expiration > 0) form.append('expiration', String(expiration));
  const label = name || filename;
  if (label) form.append('name', label);

  const url = `${IMGBB_UPLOAD_URL}?key=${encodeURIComponent(apiKey())}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      body: form,
      signal: controller.signal,
      headers: { 'User-Agent': 'Resizora/1.0 (+image-host)' },
    });
  } catch (err) {
    const aborted = err?.name === 'AbortError';
    throw new ImgbbServiceError(
      aborted
        ? `imgbb did not respond within ${timeoutMs()}ms.`
        : `Could not reach imgbb.com: ${redactKey(err?.message || err)}`,
      502,
      { layer: aborted ? 'Timeout' : 'Network' },
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!res.ok || !payload?.success) {
    const message = payload?.error?.message || `imgbb upload failed (HTTP ${res.status}).`;
    // imgbb answers a blocked IP with HTTP 400 + code 103 rather than 403, which
    // reads like a malformed request. Surface it as 403 so the client (and the
    // operator) can tell "we were banned" apart from "our payload was wrong".
    const imgbbCode = payload?.error?.code ?? null;
    const forbidden = imgbbCode === 103 || /forbidden/i.test(message);
    const status = forbidden ? 403 : res.status === 429 ? 429 : 502;
    throw new ImgbbServiceError(redactKey(message), status, {
      status: res.status,
      imgbbCode,
    });
  }

  const d = payload.data || {};
  return {
    id: d.id,
    url: d.url || d.image?.url,
    displayUrl: d.display_url || d.medium?.url || d.url,
    viewUrl: d.url_viewer || null,
    thumbUrl: d.thumb?.url || null,
    mediumUrl: d.medium?.url || null,
    deleteUrl: d.delete_url || null,
    // imgbb returns these as strings; normalise to numbers for the client.
    width: Number(d.width) || null,
    height: Number(d.height) || null,
    size: Number(d.size) || null,
    mime: d.image?.mime || null,
    extension: d.image?.extension || null,
    expiration: Number(d.expiration) || 0,
  };
}

/**
 * Delete a hosted image using the slug from the delete_url returned at upload.
 */
async function deleteImage(deleteUrlOrSlug) {
  requireConfig();
  const slug = String(deleteUrlOrSlug || '').trim().split('/').filter(Boolean).pop();
  if (!slug) throw new ImgbbServiceError('A delete URL or slug is required.', 400);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());

  let res;
  try {
    res = await fetch(
      `https://api.imgbb.com/1/delete/${encodeURIComponent(slug)}?key=${encodeURIComponent(apiKey())}`,
      { method: 'GET', signal: controller.signal, headers: { 'User-Agent': 'Resizora/1.0 (+image-host)' } },
    );
  } catch (err) {
    throw new ImgbbServiceError(
      err?.name === 'AbortError'
        ? `imgbb did not respond within ${timeoutMs()}ms.`
        : `Could not reach imgbb.com: ${redactKey(err?.message || err)}`,
      502,
    );
  } finally {
    clearTimeout(timer);
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.success) {
    throw new ImgbbServiceError(
      redactKey(payload?.error?.message || `imgbb delete failed (HTTP ${res.status}).`),
      502,
    );
  }
  return true;
}

/** Readiness probe for GET /api/storage/status (never echoes the key). */
function diagnose() {
  return {
    reachable: isConfigured(),
    provider: 'imgbb',
    configured: isConfigured(),
    detail: isConfigured()
      ? 'IMGBB_API_KEY is set on the server'
      : 'Missing IMGBB_API_KEY — add it to backend/.env',
  };
}

module.exports = {
  uploadImage,
  deleteImage,
  isConfigured,
  diagnose,
  ImgbbServiceError,
};