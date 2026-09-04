const os = require('os');
const { pool } = require('../config/db');
const {
  getDashboardStats,
  getRecentJobs,
  clearJobs,
} = require('../services/job.service');

/**
 * Helper to format bytes into readable format
 */
function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Get comprehensive dashboard statistics
 */
async function getStats(req, res, next) {
  try {
    // 1. Get database image analytics
    const imageStats = await getDashboardStats();

    // 2. Get database health and ping
    let dbStatus = 'connected';
    let dbLatencyMs = 0;
    let dbVersion = 'Unknown';
    const dbPingStart = Date.now();

    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query('SELECT VERSION() AS version');
      dbLatencyMs = Date.now() - dbPingStart;
      dbVersion = rows[0]?.version || 'Unknown';
      connection.release();
    } catch (err) {
      dbStatus = 'disconnected';
    }

    // 3. System resources
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const processMemory = process.memoryUsage();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        platform: `${os.type()} ${os.arch()}`,
        cpuCores: os.cpus().length,
        cpuModel: os.cpus()[0]?.model || 'Generic CPU',
        memory: {
          total: totalMemory,
          totalFormatted: formatBytes(totalMemory),
          used: usedMemory,
          usedFormatted: formatBytes(usedMemory),
          free: freeMemory,
          freeFormatted: formatBytes(freeMemory),
          usagePercent: Math.round((usedMemory / totalMemory) * 100),
          processRss: processMemory.rss,
          processRssFormatted: formatBytes(processMemory.rss),
          processHeapUsed: processMemory.heapUsed,
          processHeapUsedFormatted: formatBytes(processMemory.heapUsed),
          processHeapTotal: processMemory.heapTotal,
        },
      },
      database: {
        status: dbStatus,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        name: process.env.DB_NAME || 'nextjs_app',
        version: dbVersion,
        latencyMs: dbLatencyMs,
      },
      analytics: {
        ...imageStats,
        totalOriginalFormatted: formatBytes(imageStats.totalOriginalBytes),
        totalOutputFormatted: formatBytes(imageStats.totalOutputBytes),
        totalBytesSavedFormatted: formatBytes(imageStats.totalBytesSaved),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get recent image processing jobs with pagination and filtering
 */
async function getJobs(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const search = req.query.search || '';
    const format = req.query.format || '';
    const status = req.query.status || '';

    const data = await getRecentJobs(page, limit, search, format, status);

    // Format sizes for UI
    const formattedJobs = data.jobs.map((job) => ({
      ...job,
      originalSizeFormatted: formatBytes(job.original_size),
      outputSizeFormatted: formatBytes(job.output_size),
      bytesSavedFormatted: formatBytes(Math.max(0, job.original_size - job.output_size)),
    }));

    res.json({
      success: true,
      ...data,
      jobs: formattedJobs,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Clear all jobs history
 */
async function handleClearJobs(req, res, next) {
  try {
    const result = await clearJobs();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get detailed system info
 */
async function getSystemInfo(req, res, next) {
  try {
    res.json({
      success: true,
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      cpus: os.cpus(),
      networkInterfaces: os.networkInterfaces(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStats,
  getJobs,
  handleClearJobs,
  getSystemInfo,
};
