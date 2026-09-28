const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

const sharp = require('sharp');

router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;
  let pingLatencyMs = null;

  try {
    const pingStart = Date.now();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    pingLatencyMs = Date.now() - pingStart;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'error';
    dbError = err.message;
  }

  const isHealthy = dbStatus === 'connected';
  const mem = process.memoryUsage();
  const uptimeSec = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSec / 3600);
  const minutes = Math.floor((uptimeSec % 3600) / 60);
  const seconds = uptimeSec % 60;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'resizer-backend',
    database: {
      status: dbStatus,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      name: process.env.DB_NAME || 'nextjs_app',
      latencyMs: pingLatencyMs,
      ...(dbError && { error: dbError }),
    },
    system: {
      uptimeSeconds: uptimeSec,
      uptimeHuman: `${hours}h ${minutes}m ${seconds}s`,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      },
      nodeVersion: process.version,
      sharpVersion: sharp.versions ? sharp.versions.sharp : 'unknown',
      libvipsVersion: sharp.versions ? sharp.versions.vips : 'unknown',
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;
