const { pool } = require('../config/db');

/**
 * Record an image processing job into MySQL
 */
async function recordJob(jobData) {
  const {
    filename,
    originalName,
    targetFormat,
    originalSize,
    outputSize,
    savingsPercent,
    width = null,
    height = null,
    processingTimeMs = 0,
    status = 'completed',
    errorMessage = null,
  } = jobData;

  const query = `
    INSERT INTO image_jobs 
    (filename, original_name, target_format, original_size, output_size, savings_percent, width, height, processing_time_ms, status, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await pool.query(query, [
      filename || 'unknown',
      originalName || 'unknown',
      targetFormat || 'unknown',
      originalSize || 0,
      outputSize || 0,
      savingsPercent || 0,
      width,
      height,
      processingTimeMs,
      status,
      errorMessage,
    ]);
    return result.insertId;
  } catch (error) {
    console.error('Failed to log job to MySQL:', error.message);
    return null;
  }
}

/**
 * Get aggregated dashboard statistics from MySQL
 */
async function getDashboardStats() {
  try {
    // 1. Overall stats
    const [overallRows] = await pool.query(`
      SELECT 
        COUNT(*) AS total_jobs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_jobs,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_jobs,
        COALESCE(SUM(original_size), 0) AS total_original_bytes,
        COALESCE(SUM(output_size), 0) AS total_output_bytes,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN savings_percent ELSE NULL END), 0) AS avg_savings_percent,
        COALESCE(AVG(processing_time_ms), 0) AS avg_processing_time_ms
      FROM image_jobs
    `);

    const overall = overallRows[0];
    const totalOriginal = Number(overall.total_original_bytes) || 0;
    const totalOutput = Number(overall.total_output_bytes) || 0;
    const totalBytesSaved = Math.max(0, totalOriginal - totalOutput);

    // 2. Format breakdown
    const [formatRows] = await pool.query(`
      SELECT 
        target_format,
        COUNT(*) AS count,
        COALESCE(SUM(output_size), 0) AS total_size
      FROM image_jobs
      WHERE status = 'completed'
      GROUP BY target_format
      ORDER BY count DESC
    `);

    // 3. Activity in the last 24 hours (grouped by hour or recent 7 days)
    const [activityRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:00') AS time_bucket,
        COUNT(*) AS count,
        COALESCE(SUM(original_size - output_size), 0) AS bytes_saved
      FROM image_jobs
      WHERE created_at >= NOW() - INTERVAL 24 HOUR
      GROUP BY time_bucket
      ORDER BY time_bucket ASC
    `);

    return {
      totalJobs: Number(overall.total_jobs),
      completedJobs: Number(overall.completed_jobs),
      failedJobs: Number(overall.failed_jobs),
      totalOriginalBytes: totalOriginal,
      totalOutputBytes: totalOutput,
      totalBytesSaved,
      avgSavingsPercent: Math.round(Number(overall.avg_savings_percent) * 10) / 10,
      avgProcessingTimeMs: Math.round(Number(overall.avg_processing_time_ms)),
      formatBreakdown: formatRows,
      activity24h: activityRows,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats from MySQL:', error.message);
    return {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      totalOriginalBytes: 0,
      totalOutputBytes: 0,
      totalBytesSaved: 0,
      avgSavingsPercent: 0,
      avgProcessingTimeMs: 0,
      formatBreakdown: [],
      activity24h: [],
    };
  }
}

/**
 * Get recent jobs with pagination and optional filtering
 */
async function getRecentJobs(page = 1, limit = 15, search = '', format = '', status = '') {
  try {
    const offset = (page - 1) * limit;
    let whereClauses = ['1=1'];
    let params = [];

    if (search) {
      whereClauses.push('(original_name LIKE ? OR filename LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (format) {
      whereClauses.push('target_format = ?');
      params.push(format);
    }

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.join(' AND ');

    // Total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM image_jobs WHERE ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    // Jobs list
    const [jobs] = await pool.query(
      `
      SELECT 
        id,
        filename,
        original_name,
        target_format,
        original_size,
        output_size,
        savings_percent,
        width,
        height,
        processing_time_ms,
        status,
        error_message,
        created_at
      FROM image_jobs
      WHERE ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    return {
      jobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  } catch (error) {
    console.error('Error fetching recent jobs from MySQL:', error.message);
    return {
      jobs: [],
      pagination: { page, limit, total: 0, totalPages: 1 },
    };
  }
}

/**
 * Clear image processing history logs
 */
async function clearJobs() {
  try {
    const [result] = await pool.query('TRUNCATE TABLE image_jobs');
    return { success: true, message: 'All job logs cleared successfully.' };
  } catch (error) {
    console.error('Error truncating image_jobs:', error.message);
    throw error;
  }
}

module.exports = {
  recordJob,
  getDashboardStats,
  getRecentJobs,
  clearJobs,
};
