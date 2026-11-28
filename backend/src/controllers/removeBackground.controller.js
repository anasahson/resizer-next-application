const sharp = require('sharp');
const removeBackgroundService = require('../services/removeBackground.service');

const MAX_PIXELS = 50_000_000;

function getStatus(req, res) {
  const status = removeBackgroundService.getStatus();
  const allowed = status.allowedUserIds.includes(String(req.user.id));
  return res.json({
    configured: status.configured,
    available: status.configured && allowed,
  });
}

async function handleRemoveBackground(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Choose an image to remove its background.' });
    }

    let metadata;
    try {
      metadata = await sharp(req.file.buffer).metadata();
    } catch {
      return res.status(400).json({ success: false, error: 'The uploaded file is not a valid supported image.' });
    }
    if (!['jpeg', 'png', 'webp'].includes(metadata.format)) {
      return res.status(415).json({
        success: false,
        error: 'Use a JPEG, PNG, or WebP image for background removal.',
      });
    }
    if (!metadata.width || !metadata.height || metadata.width * metadata.height > MAX_PIXELS) {
      return res.status(413).json({
        success: false,
        error: 'The image exceeds the 50-megapixel processing limit.',
      });
    }

    const output = await removeBackgroundService.removeBackground({
      buffer: req.file.buffer,
      filename: `image.${metadata.format === 'jpeg' ? 'jpg' : metadata.format}`,
      mimeType: `image/${metadata.format}`,
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', output.length);
    res.setHeader('Content-Disposition', 'attachment; filename="background-removed.png"');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.send(output);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, error: error.message });
    }
    return next(error);
  }
}

module.exports = { getStatus, handleRemoveBackground };
