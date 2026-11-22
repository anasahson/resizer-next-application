const multer = require('multer');

// Store files in memory buffer for fast Sharp processing
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/tiff',
  'image/gif',
  'image/svg+xml',
  'image/heic',
  'image/heif'
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file format: ${file.mimetype}. Only image files are accepted.`), false);
  }
};

const configuredMaxFileSize = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50) * 1024 * 1024;
const maxFileSize = process.env.VERCEL === '1'
  ? Math.min(configuredMaxFileSize, 16 * 1024 * 1024)
  : configuredMaxFileSize;

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
    files: 50, // allow up to 50 images in batch
  },
  fileFilter,
});

module.exports = upload;
module.exports.MAX_FILE_SIZE_BYTES = maxFileSize;
