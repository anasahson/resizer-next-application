/**
 * Storage Routes
 * imgbb-backed image hosting with permanent, shareable CDN URLs.
 */

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');
const { uploadLimiter, uploadGate } = require('../middleware/upload-guard.middleware');
const {
  handleStorageUpload,
  handleServeStoredImage,
  handleDeleteStoredImage,
  handleDeleteHostedImage,
  handleListStoredImages,
  handleStorageStatus,
  handleStorageDiagnose,
} = require('../controllers/storage.controller');

// Configuration probe (never exposes the API key)
router.get('/status', handleStorageStatus);

// Readiness report
router.get('/diagnose', handleStorageDiagnose);

// Endpoint documentation
router.get('/', (req, res) => {
  res.json({
    endpoint: '/api/storage/upload',
    method: 'POST',
    description: 'Upload a processed image to imgbb (attempts are logged to JSONL, never written to the database)',
    contentType: 'multipart/form-data or application/json',
    body: {
      image: 'multipart file field (preferred)',
      imageData: 'or a base64 data URI string',
      filename: 'string (optional)',
      caption: 'string (optional)',
    },
    note: 'Requires IMGBB_API_KEY on the server.',
  });
});

// Upload — rate limited, queued behind the concurrency gate, then attributed
// to the signed-in user when present. The gate runs before multer so queued
// requests never sit in memory holding a decoded file.
router.post('/upload', uploadLimiter, uploadGate, optionalAuth, upload.single('image'), handleStorageUpload);

// Delete an image from imgbb (must be declared before '/:id' so it isn't
// swallowed by that pattern). Images are not in the database, so this takes
// the delete_url returned by POST /api/storage/upload.
router.delete('/hosted', authenticateToken, handleDeleteHostedImage);

// The signed-in user's saved links, rebuilt from the hosting log
router.get('/images', authenticateToken, handleListStoredImages);

// Retired: no stored_images row exists any more (kept for a clear 410)
router.delete('/:id', authenticateToken, handleDeleteStoredImage);

// Retired: hosted urls are public and returned by /upload (kept for a clear 410)
router.get('/:id/image', handleServeStoredImage);

module.exports = router;
