/**
 * Shareable Result Service
 * Creates shareable result cards for viral growth
 */

const { pool } = require('../config/db');
const crypto = require('crypto');

/**
 * Create shareable result card
 */
async function createShareableResult(userId, imageData) {
  try {
    const shareId = crypto.randomBytes(12).toString('hex');
    const shareUrl = `${process.env.FRONTEND_URL}/share/${shareId}`;

    await pool.query(
      `INSERT INTO shareable_results (share_id, user_id, original_size, output_size, savings_percent, format, width, height, compression_time_ms, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [
        shareId,
        userId,
        imageData.originalSize,
        imageData.outputSize,
        imageData.savingsPercent,
        imageData.format,
        imageData.width,
        imageData.height,
        imageData.processingTime,
      ]
    );

    return {
      success: true,
      shareId,
      shareUrl,
      expiresIn: '7 days',
    };
  } catch (error) {
    console.error('Error creating shareable result:', error);
    throw error;
  }
}

/**
 * Get shareable result by ID
 */
async function getShareableResult(shareId) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM shareable_results WHERE share_id = ? AND expires_at > NOW()`,
      [shareId]
    );

    if (rows.length === 0) {
      return null;
    }

    const result = rows[0];

    // Increment view count
    await pool.query(
      `UPDATE shareable_results SET view_count = view_count + 1 WHERE share_id = ?`,
      [shareId]
    );

    return result;
  } catch (error) {
    console.error('Error fetching shareable result:', error);
    throw error;
  }
}

/**
 * Get user's shared results
 */
async function getUserSharedResults(userId) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM shareable_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching user shared results:', error);
    throw error;
  }
}

/**
 * Get viral stats (top shared results)
 */
async function getViralStats() {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM shareable_results 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY view_count DESC 
       LIMIT 10`
    );
    return rows.map((r) => ({
      ...r,
      viral_score: (r.view_count || 0) + ((r.click_count || 0) * 10) + ((r.share_count || 0) * 50),
    }));
  } catch (error) {
    console.error('Error fetching viral stats:', error);
    return [];
  }
}

/**
 * Track share click (when user shares on social)
 */
async function trackShare(shareId, platform) {
  try {
    await pool.query(
      `UPDATE shareable_results SET share_count = share_count + 1, last_shared_at = NOW() WHERE share_id = ?`,
      [shareId]
    );

    await pool.query(
      `INSERT INTO share_analytics (share_id, platform, timestamp)
       VALUES (?, ?, NOW())`,
      [shareId, platform]
    );

    return { success: true };
  } catch (error) {
    console.error('Error tracking share:', error);
    throw error;
  }
}

/**
 * Track click to upgrade
 */
async function trackUpgradeClick(shareId) {
  try {
    await pool.query(
      `UPDATE shareable_results SET click_count = click_count + 1 WHERE share_id = ?`,
      [shareId]
    );
    return { success: true };
  } catch (error) {
    console.error('Error tracking upgrade click:', error);
    throw error;
  }
}

module.exports = {
  createShareableResult,
  getShareableResult,
  getUserSharedResults,
  getViralStats,
  trackShare,
  trackUpgradeClick,
};
