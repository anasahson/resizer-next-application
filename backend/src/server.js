const app = require('./app');
const { testConnection, pool } = require('./config/db');
const { initDb } = require('./config/dbInit');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Test Database Connection and Initialize Tables
  const isDbConnected = await testConnection();
  if (isDbConnected) {
    await initDb();
  }

  const server = app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🚀 Resizer Backend Server is running!`);
    console.log(`📡 API URL:   http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🩺 Health:    http://localhost:${PORT}/api/health`);
    console.log(`📁 Mode:      ${process.env.NODE_ENV || 'development'}`);
    console.log(`========================================`);
  });

  // Graceful shutdown handling
  const handleShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Gracefully closing server...`);
    try {
      if (pool) {
        await pool.end();
        console.log('MySQL connection pool closed.');
      }
    } catch (err) {
      console.error('Error while closing MySQL pool:', err.message);
    }

    server.close(() => {
      console.log('Server closed successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer();
