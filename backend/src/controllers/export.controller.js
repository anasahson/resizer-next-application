/**
 * Cloud Export Controller
 * Handles exporting processed images to imgbb
 */

const { exportToImgbb } = require('../services/cloudExport.service');

function extractBuffer(req) {
  if (req.file && req.file.buffer) {
    return {
      buffer: req.file.buffer,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
    };
  }

  const { imageData, dataBase64, filename, mimeType } = req.body || {};
  const rawBase64 = imageData || dataBase64;

  if (rawBase64 && typeof rawBase64 === 'string') {
    const matches = rawBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      return {
        buffer: Buffer.from(matches[2], 'base64'),
        filename: filename || 'image.webp',
        mimeType: matches[1] || mimeType || 'image/webp',
      };
    }
    return {
      buffer: Buffer.from(rawBase64, 'base64'),
      filename: filename || 'image.webp',
      mimeType: mimeType || 'image/webp',
    };
  }

  return null;
}

/**
 * POST /api/export/imgbb
 * Upload the processed image to imgbb and return the shareable links.
 */
async function handleImgbbExport(req, res) {
  try {
    const fileData = extractBuffer(req);
    if (!fileData) {
      return res.status(400).json({
        success: false,
        error: 'No image data provided. Provide a multipart file or base64 "imageData" in body.',
      });
    }

    const result = await exportToImgbb({
      fileBuffer: fileData.buffer,
      filename: fileData.filename,
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'Failed to upload image to imgbb',
    });
  }
}

module.exports = { handleImgbbExport };
