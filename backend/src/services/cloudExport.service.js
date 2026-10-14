/**
 * Cloud Export Service
 * Uploads processed images to imgbb (see imgbb.service.js for the API
 * contract and env configuration).
 */

const host = require('./imgbb.service');

/**
 * Upload an image to the host and return its shareable links.
 *
 * @param {Object} options
 * @param {Buffer} options.fileBuffer - The processed image bytes
 * @param {string} [options.filename]  - Display name for the hosted image
 */
async function exportToImgbb({ fileBuffer, filename, name }) {
  const uploaded = await host.uploadImage({ fileBuffer, filename: filename || name });
  return {
    success: true,
    provider: 'imgbb',
    imageUrl: uploaded.url,
    width: uploaded.width,
    height: uploaded.height,
    filename: filename || name || 'image.webp',
    mimeType: uploaded.mime,
    sizeBytes: uploaded.size,
  };
}

module.exports = { exportToImgbb };
