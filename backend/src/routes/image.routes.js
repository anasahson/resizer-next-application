const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { checkQuotaOptional } = require('../middleware/quota.middleware');
const { optionalAuth } = require('../middleware/auth.middleware');
const {
  getImageMetadata,
  processImage,
  processBatch,
} = require('../controllers/image.controller');

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

module.exports = router;
