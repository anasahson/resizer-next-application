const mysql = require('mysql2/promise');
require('dotenv').config();

if (process.env.NODE_ENV === 'production') {
  const requiredDatabaseSettings = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingDatabaseSettings = requiredDatabaseSettings.filter((setting) => !process.env[setting]);

  if (missingDatabaseSettings.length > 0) {
    throw new Error(`Missing production database configuration: ${missingDatabaseSettings.join(', ')}`);
  }
}

// Create connection pool for MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nextjs_app',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

let dbConnected = false;

/**
 * Test MySQL database connection
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 + 1 AS result, VERSION() AS version');
    connection.release();
    console.log(`✅ MySQL Database Connected Successfully! (Version: ${rows[0].version})`);
    console.log(`📡 Database: ${process.env.DB_NAME || 'nextjs_app'} on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    dbConnected = true;
    return true;
  } catch (error) {
    console.log('ℹ️ MySQL database is not connected. Running in database-optional mode with in-memory store.');
    dbConnected = false;
    return false;
  }
};

const isDbAvailable = () => dbConnected;

module.exports = {
  pool,
  testConnection,
  isDbAvailable,
};

