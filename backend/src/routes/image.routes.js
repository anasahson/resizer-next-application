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
router.post('/metadata', optionalAuth, checkQuotaOptional, upload.single('image'), getImageMetadata);

// Single image processing endpoint (public — no login required; optionally identifies user)
router.post('/process', optionalAuth, checkQuotaOptional, upload.single('image'), processImage);

// Batch processing endpoint (public — no login required; optionally identifies user)
router.post('/batch', optionalAuth, checkQuotaOptional, upload.array('images', 50), processBatch);

module.exports = router;
