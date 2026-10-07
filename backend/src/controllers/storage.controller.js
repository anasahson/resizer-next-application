/**
 * Storage Controller
 * Uploads processed canvas images to imgbb (i.ibb.co). Images are never stored
 * in the database: every attempt is appended to a daily JSONL log instead.
 */

const { uploadImage, deleteImage, isConfigured, diagnose, ImgbbServiceError } = require('../services/imgbb.service');
const { logHostingEvent, listSavedImages, currentLogFile } = require('../services/hostingLog.service');
const { isDbAvailable } = require('../config/db');

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif|gif|tiff?|heic|heif)$/i;

/** Accept either a multipart "image" file or a base64 imageData/dataBase64 body. */
function extractUpload(req) {
  if (req.file && req.file.buffer && req.file.buffer.length > 0) {
    return {
      buffer: req.file.buffer,
      filename: req.file.originalname || 'image.webp',
      mimeType: req.file.mimetype || 'image/webp',
    };
  }

  const { imageData, dataBase64, filename, mimeType } = req.body || {};
  const rawBase64 = imageData || dataBase64;
  if (!rawBase64 || typeof rawBase64 !== 'string') return null;

  const matches = rawBase64.match(/^data:([A-Za-z0-9-+/]+);base64,(.+)$/);
  const base64Payload = matches ? matches[2] : rawBase64;

  return {
    buffer: Buffer.from(base64Payload, 'base64'),
    filename: filename || 'image.webp',
    mimeType: (matches && matches[1]) || mimeType || 'image/webp',
  };
}

function sanitiseFilename(name) {
  const cleaned = String(name || 'image').replace(/[^\w.-]+/g, '_').slice(0, 240);
  return IMAGE_EXTENSIONS.test(cleaned) ? cleaned : `${cleaned}.webp`;
}

function sendError(res, err) {
  const status = err instanceof ImgbbServiceError ? err.statusCode : 500;
  if (status >= 500) console.error('[storage] unexpected failure:', err);

  const body = {
    success: false,
    error: err.message || 'Image storage operation failed',
  };

  // Hosting errors already carry a layer-tagged breakdown (network/timeout/rate limit).
  if (err instanceof ImgbbServiceError && err.details) {
    body.diagnosis = err.details;
  }

  return res.status(status).json(body);
}

/**
 * POST /api/storage/upload
 * Upload the processed image to imgbb. Nothing is written to the database; the
 * attempt is appended to the daily JSONL hosting log. If imgbb fails, nothing
 * is recorded beyond the failure entry in that log.
 */
async function handleStorageUpload(req, res) {
  const startedAt = Date.now();
  // Where the image came from: URL import vs a file picked/dropped in the app.
  const source = ['url-import', 'system-file'].includes(req.body?.source) ? req.body.source : 'system-file';

  try {
    const upload = extractUpload(req);
    if (!upload) {
      return res.status(400).json({
        success: false,
        error: 'No image provided. Send a multipart "image" field or base64 "imageData".',
      });
    }

    const filename = sanitiseFilename(upload.filename);
    const caption = (req.body && req.body.caption) || `Optimised with Resizora — ${filename}`;

    const uploaded = await uploadImage({
      fileBuffer: upload.buffer,
      filename,
      name: filename,
    });

    // Images are hosted on imgbb and recorded ONLY in the log file — nothing
    // is written to the database. `HOSTING_LOG_DB=1` opts into keeping log
    // metadata rows in MySQL as well.
    logHostingEvent({
      source,
      status: 'saved',
      filename,
      url: uploaded.url,
      durationMs: Date.now() - startedAt,
      sizeBytes: uploaded.size || upload.buffer.length,
      mimeType: uploaded.mime || upload.mimeType,
      userId: req.user?.id ?? null,
    });

    return res.status(201).json({
      success: true,
      // The direct CDN url is the canonical shareable link.
      imageUrl: uploaded.url,
      displayUrl: uploaded.displayUrl,
      viewUrl: uploaded.viewUrl,
      thumbUrl: uploaded.thumbUrl,
      hosting: {
        id: uploaded.id,
        deleteUrl: uploaded.deleteUrl,
        expiration: uploaded.expiration,
      },
      width: uploaded.width,
      height: uploaded.height,
      filename,
      mimeType: uploaded.mime || upload.mimeType,
      sizeBytes: uploaded.size || upload.buffer.length,
      // Nothing is persisted to a database by design.
      persisted: false,
      logFile: currentLogFile(),
    });
  } catch (err) {
    // Record the failure so "where did it fail" is answerable later — this is
    // exactly what would have captured the imgbb rejections (HTTP 400 code 103).
    logHostingEvent({
      source,
      status: 'failed',
      filename: req.body?.filename || req.file?.originalname || null,
      error: err.message,
      durationMs: Date.now() - startedAt,
      sizeBytes: req.file?.size || null,
      mimeType: req.file?.mimetype || null,
      userId: req.user?.id ?? null,
    });
    return sendError(res, err);
  }
}

/**
 * GET /api/storage/:id/image
 *
 * Deprecated. This used to redirect to the CDN via a `stored_images` row, but
 * nothing is written to the database any more, so there is no id to look up.
 * The hosted url is already public and is returned directly by
 * POST /api/storage/upload — use that instead of proxying through us.
 */
async function handleServeStoredImage(req, res) {
  return res.status(410).json({
    success: false,
    error: 'This endpoint is retired: images are no longer stored in a database.',
    detail:
      'Use the "imageUrl" returned by POST /api/storage/upload, or GET /api/storage/images for saved links.',
  });
}

/**
 * DELETE /api/storage/:id
 *
 * Deprecated for the same reason as above — there is no stored_images row to
 * remove. Call DELETE /api/storage/hosted with the imgbb delete_url instead.
 */
async function handleDeleteStoredImage(req, res) {
  return res.status(410).json({
    success: false,
    error: 'This endpoint is retired: images are no longer stored in a database.',
    detail:
      'Use DELETE /api/storage/hosted with the "hosting.deleteUrl" returned by POST /api/storage/upload.',
  });
}

/**
 * DELETE /api/storage/hosted — actually remove an image from imgbb.
 *
 * imgbb is a real host, so unlike the previous keyless provider we can delete
 * remotely: the delete_url (or bare slug) returned at upload is all we need.
 *
 * @param {string} [req.body.deleteUrl] - full delete_url from the upload response
 * @param {string} [req.body.slug]      - or just the imgbb slug
 */
async function handleDeleteHostedImage(req, res) {
  const target = req.body?.deleteUrl || req.body?.slug || req.query?.deleteUrl || req.query?.slug;
  if (!target) {
    return res.status(400).json({
      success: false,
      error:
        'Provide the imgbb deleteUrl (or slug) returned by POST /api/storage/upload as "deleteUrl" in the body.',
    });
  }
  try {
    await deleteImage(target);
    // Record the removal so the saved list stops offering a dead link.
    logHostingEvent({
      source: req.body?.source || 'system-file',
      status: 'deleted',
      url: req.body?.url || null,
      filename: req.body?.filename || null,
      error: null,
      userId: req.user?.id ?? null,
    });
    return res.json({ success: true, remoteDeleted: true, target });
  } catch (err) {
    return sendError(res, err);
  }
}

/**
 * GET /api/storage/images — the signed-in user's saved links, rebuilt from the
 * hosting log (the database no longer stores images).
 */
async function handleListStoredImages(req, res) {
  try {
    const images = await listSavedImages({ userId: req.user?.id ?? null, limit: req.query.limit });
    return res.json({
      success: true,
      count: images.length,
      source: 'hosting-log',
      images: images.map((img) => ({
        ...img,
        imageUrl: img.url,
      })),
    });
  } catch (err) {
    return sendError(res, err);
  }
}

/** GET /api/storage/status — configuration probe that never leaks the key. */
function handleStorageStatus(req, res) {
  return res.json({
    success: true,
    provider: 'imgbb',
    storageConfigured: isConfigured(),
    databaseAvailable: isDbAvailable(),
  });
}

/**
 * GET /api/storage/diagnose — readiness report (config + optional auto-expiry).
 * Use it to tell a missing key apart from an unreachable host.
 */
async function handleStorageDiagnose(req, res) {
  try {
    const report = await diagnose();
    return res.status(report.reachable ? 200 : 503).json({ success: report.reachable, ...report });
  } catch (err) {
    return sendError(res, err);
  }
}

module.exports = {
  handleStorageUpload,
  handleServeStoredImage,
  handleDeleteStoredImage,
  handleDeleteHostedImage,
  handleListStoredImages,
  handleStorageStatus,
  handleStorageDiagnose,
};


