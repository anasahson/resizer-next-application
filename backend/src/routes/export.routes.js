/**
 * Cloud Export Routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ limits: { fileSize: 32 * 1024 * 1024 } });
const { uploadLimiter, uploadGate } = require('../middleware/upload-guard.middleware');
const { handleImgbbExport } = require('../controllers/export.controller');

// imgbb Export
router.get('/imgbb', (req, res) => {
  res.json({
    endpoint: '/api/export/imgbb',
    method: 'POST',
    description: 'Upload a processed image to imgbb and get a permanent shareable URL back',
    contentType: 'application/json or multipart/form-data',
    body: {
      imageData: 'base64 data URI string OR upload as multipart file',
      filename: 'string (optional)',
    },
    note: 'Requires IMGBB_API_KEY on the server. For saved history use POST /api/storage/upload.',
  });
});
router.post('/imgbb', uploadLimiter, uploadGate, upload.single('file'), handleImgbbExport);

module.exports = router;
