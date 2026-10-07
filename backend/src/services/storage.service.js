/**
 * Storage Service
 * MySQL persistence for hosted images. Only metadata + the stable provider
 * urls/ids are stored — never binary blobs.
 *
 * The provider_image_id / provider_delete_url columns replaced the old
 * Telegram-specific ones via an additive migration in config/dbInit.js, so
 * existing rows keep working (the legacy columns stay nullable).
 */

const { pool, isDbAvailable } = require('../config/db');

/**
 * Insert a stored image record.
 * @returns {Promise<number|null>} new row id, or null when the DB is offline
 */
async function createStoredImage({
  providerImageId,
  providerDeleteUrl = null,
  originalFilename = null,
  mimeType = 'image/webp',
  sizeBytes = 0,
  userId = null,
  caption = null,
}) {
  if (!isDbAvailable()) return null;

  const [result] = await pool.query(
    `INSERT INTO stored_images
       (image_url, provider_image_id, provider_delete_url, original_filename,
        mime_type, size_bytes, user_id, caption)
     VALUES ('', ?, ?, ?, ?, ?, ?, ?)`,
    [
      providerImageId,
      providerDeleteUrl,
      originalFilename,
      mimeType,
      sizeBytes,
      userId,
      caption,
    ],
  );

  return result.insertId || null;
}

/**
 * Point a record at its permanent public url once the row id is known.
 * The public host url is stored so the link survives a domain change.
 */
async function setImageUrl(id, url) {
  if (!isDbAvailable()) return;
  await pool.query('UPDATE stored_images SET image_url = ? WHERE id = ?', [url, id]);
}

/** Fetch a single stored image record by id. */
async function getStoredImageById(id) {
  if (!isDbAvailable()) return null;

  const [rows] = await pool.query(
    `SELECT id, image_url, provider_image_id, provider_delete_url, original_filename,
            mime_type, size_bytes, user_id, caption, created_at
       FROM stored_images
      WHERE id = ?
      LIMIT 1`,
    [id],
  );

  return rows[0] || null;
}

/** List stored images, restricted to one user. */
async function listStoredImagesByUser(userId, limit = 50) {
  if (!isDbAvailable()) return [];

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

  const [rows] = await pool.query(
    `SELECT id, image_url, original_filename, mime_type, size_bytes, caption, created_at
       FROM stored_images
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ${safeLimit}`,
    [userId],
  );

  return rows;
}

/** Delete a stored image row. Returns true when a row was removed. */
async function deleteStoredImage(id) {
  if (!isDbAvailable()) return false;
  const [result] = await pool.query('DELETE FROM stored_images WHERE id = ?', [id]);
  return (result.affectedRows || 0) > 0;
}

module.exports = {
  createStoredImage,
  setImageUrl,
  getStoredImageById,
  listStoredImagesByUser,
  deleteStoredImage,
};
