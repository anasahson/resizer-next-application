const MAX_UPLOAD_REQUEST_BYTES = 18 * 1024 * 1024;
const uploadPaths = new Set([
  '/api/images/metadata',
  '/api/images/process',
  '/api/images/batch',
  '/api/storage/upload',
  '/api/export/imgbb',
]);

function vercelUploadBodyLimit(req, res, next) {
  if (process.env.VERCEL !== '1' || !uploadPaths.has(req.path)) {
    return next();
  }

  const contentLength = Number(req.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_REQUEST_BYTES) {
    return res.status(413).json({
      success: false,
      error: 'PayloadTooLarge',
      message: 'Vercel deployments accept image upload requests up to 18 MiB. Reduce the image size or batch size and try again.',
    });
  }

  return next();
}

module.exports = vercelUploadBodyLimit;
module.exports.MAX_UPLOAD_REQUEST_BYTES = MAX_UPLOAD_REQUEST_BYTES;
