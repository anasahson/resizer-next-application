const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const dns = require('node:dns').promises;
const net = require('node:net');
const multer = require('multer');
const upload = require('../middleware/upload.middleware');
const { checkQuotaOptional } = require('../middleware/quota.middleware');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');
const removeBackgroundService = require('../services/removeBackground.service');
const {
  getStatus: getRemoveBackgroundStatus,
  handleRemoveBackground,
} = require('../controllers/removeBackground.controller');
const {
  getImageMetadata,
  processImage,
  processBatch,
} = require('../controllers/image.controller');

const REMOVE_BG_MAX_BYTES = 10 * 1024 * 1024;
const removeBackgroundUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: REMOVE_BG_MAX_BYTES, files: 1 },
  fileFilter: (req, file, callback) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(null, true);
    }
    const error = new Error('Choose a JPEG, PNG, or WebP image.');
    error.status = 415;
    return callback(error);
  },
});
const removeBackgroundLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Background removal is limited to 3 requests per 15 minutes. Please try again later.',
  },
});

function requireRemoveBackgroundAccess(req, res, next) {
  const { configured, allowedUserIds } = removeBackgroundService.getStatus();
  if (!configured) {
    return res.status(503).json({
      success: false,
      error: 'Background removal is not configured on the server.',
    });
  }
  if (!allowedUserIds.includes(String(req.user.id))) {
    return res.status(403).json({
      success: false,
      error: 'Your account is not enabled for background removal.',
    });
  }
  return next();
}

router.get('/remove-background/status', authenticateToken, getRemoveBackgroundStatus);
router.post(
  '/remove-background',
  authenticateToken,
  requireRemoveBackgroundAccess,
  removeBackgroundLimiter,
  removeBackgroundUpload.single('image'),
  handleRemoveBackground
);

// Metadata extraction endpoint (public, optional auth for quota tracking)
router.get('/metadata', (req, res) => {
  res.json({
    endpoint: '/api/images/metadata',
    method: 'POST',
    description: 'Extract EXIF metadata, dimensions, color space, and file format from an image',
    contentType: 'multipart/form-data',
    fields: { image: 'File (single image)' },
  });
});
router.post('/metadata', optionalAuth, checkQuotaOptional, upload.single('image'), getImageMetadata);

// Single image processing endpoint (public — no login required; optionally identifies user)
router.get('/process', (req, res) => {
  res.json({
    endpoint: '/api/images/process',
    method: 'POST',
    description: 'Process, resize, compress, crop, and convert a single image file',
    contentType: 'multipart/form-data',
    queryParams: { responseType: 'json | binary (default: binary)' },
    fields: {
      image: 'File (required)',
      width: 'number (optional)',
      height: 'number (optional)',
      scale: 'number (optional)',
      format: 'webp | jpeg | png | avif | gif (optional)',
      quality: 'number 1-100 (optional)',
    },
  });
});
router.post('/process', optionalAuth, checkQuotaOptional, upload.single('image'), processImage);

// Batch processing endpoint (public — no login required; optionally identifies user)
router.get('/batch', (req, res) => {
  res.json({
    endpoint: '/api/images/batch',
    method: 'POST',
    description: 'Batch process, resize, and compress up to 50 images in parallel',
    contentType: 'multipart/form-data',
    queryParams: { responseType: 'json | zip (default: zip)' },
    fields: {
      images: 'File[] (up to 50 files, required)',
      width: 'number (optional)',
      height: 'number (optional)',
      scale: 'number (optional)',
      format: 'webp | jpeg | png | avif (optional)',
      quality: 'number 1-100 (optional)',
    },
  });
});
router.post('/batch', optionalAuth, checkQuotaOptional, upload.array('images', 50), processBatch);

// ─────────────────────────────────────────────────────────────────────────────
// Remote image proxy (URL import)
//
// The browser cannot fetch most remote images directly: hosts rarely send
// `Access-Control-Allow-Origin`, so `fetch(url)` fails with "Failed to fetch".
// This endpoint proxies it server-side.
//
// It accepts an arbitrary URL, so it is guarded against SSRF: http/https only,
// no embedded credentials, every resolved IP checked against private/loopback
// /link-local ranges (this also blocks cloud metadata at 169.254.169.254),
// redirects followed manually with re-validation, and size/time caps.
// ─────────────────────────────────────────────────────────────────────────────
const urlLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many URL imports. Please wait a moment.' },
});

const MAX_REMOTE_BYTES = 25 * 1024 * 1024;
const REMOTE_TIMEOUT_MS = 20000;
const MAX_REMOTE_REDIRECTS = 3;

function isBlockedIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 192 && b === 0) return true;
    if (a >= 224) return true; // multicast + reserved
    return false;
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === '::' || v === '::1') return true;
    if (v.startsWith('::ffff:')) return isBlockedIp(v.slice(7));
    if (/^fe[89ab]/.test(v)) return true; // link-local
    if (/^f[cd]/.test(v)) return true; // unique local
    return false;
  }
  return true; // anything we cannot reason about is not allowed
}

async function assertPublicUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    const err = new Error('That does not look like a valid URL.');
    err.status = 400;
    throw err;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    const err = new Error('Only http:// and https:// URLs are supported.');
    err.status = 400;
    throw err;
  }
  if (parsed.username || parsed.password) {
    const err = new Error('URLs with embedded credentials are not allowed.');
    err.status = 400;
    throw err;
  }
  let addresses;
  try {
    addresses = await dns.lookup(parsed.hostname, { all: true });
  } catch {
    const err = new Error(`Could not resolve ${parsed.hostname}.`);
    err.status = 400;
    throw err;
  }
  if (!addresses.length || addresses.some((a) => isBlockedIp(a.address))) {
    const err = new Error('Blocked: URLs pointing at private or local addresses are not allowed.');
    err.status = 403;
    throw err;
  }
  return parsed;
}

router.post('/fetch-url', urlLimiter, async (req, res) => {
  const rawUrl = String(req.body?.url || '').trim();
  if (!rawUrl) return res.status(400).json({ success: false, error: 'Please provide a URL.' });

  let target;
  try {
    target = await assertPublicUrl(rawUrl);
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, error: err.message });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);

  try {
    let upstream = null;
    for (let hop = 0; hop <= MAX_REMOTE_REDIRECTS; hop += 1) {
      upstream = await fetch(target.toString(), {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'Resizora/1.0 (+image-proxy)', Accept: 'image/*' },
      });
      if (upstream.status < 300 || upstream.status >= 400) break;
      const location = upstream.headers.get('location');
      if (!location) {
        return res.status(502).json({ success: false, error: 'The image host returned an unusable redirect.' });
      }
      if (hop === MAX_REMOTE_REDIRECTS) {
        return res.status(502).json({ success: false, error: 'Too many redirects while fetching the image.' });
      }
      target = await assertPublicUrl(new URL(location, target).toString());
    }

    if (!upstream || !upstream.ok) {
      return res.status(502).json({
        success: false,
        error: `The image host replied with HTTP ${upstream ? upstream.status : 'no response'}.`,
      });
    }

    const contentType = upstream.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return res.status(415).json({
        success: false,
        error: `That URL does not return an image (content-type: ${contentType || 'unknown'}).`,
      });
    }

    const declared = Number(upstream.headers.get('content-length') || 0);
    if (declared > MAX_REMOTE_BYTES) {
      return res.status(413).json({ success: false, error: 'That image is larger than 25 MB.' });
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.length > MAX_REMOTE_BYTES) {
      return res.status(413).json({ success: false, error: 'That image is larger than 25 MB.' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(buffer);
  } catch (err) {
    const aborted = err?.name === 'AbortError';
    return res.status(502).json({
      success: false,
      error: aborted
        ? `The image host did not respond within ${REMOTE_TIMEOUT_MS / 1000}s.`
        : `Could not fetch that image: ${err.message}`,
    });
  } finally {
    clearTimeout(timer);
  }
});

module.exports = router;
