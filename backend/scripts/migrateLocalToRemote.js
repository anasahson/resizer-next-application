const mysql = require('mysql2/promise');
const { pool: remotePool } = require('../src/config/db');
const { initDb } = require('../src/config/dbInit');

const tables = [
  'User',
  'image_jobs',
  'subscriptions',
  'blog_posts',
  'system_settings',
  'shareable_results',
  'referrals',
  'referral_clicks',
  'analytics_events',
];

const localPool = mysql.createPool({
  host: process.env.LOCAL_DB_HOST || 'localhost',
  port: Number(process.env.LOCAL_DB_PORT || 3306),
  user: process.env.LOCAL_DB_USER || 'admin',
  password: process.env.LOCAL_DB_PASSWORD,
  database: process.env.LOCAL_DB_NAME || 'nextjs_app',
  waitForConnections: true,
  connectionLimit: 2,
});

async function getCount(pool, table) {
  const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
  return Number(rows[0].count);
}

async function getColumns(pool, table) {
  const [rows] = await pool.query(`SHOW COLUMNS FROM \`${table}\``);
  return rows.map((row) => row.Field);
}

async function copyTable(table) {
  const localColumns = await getColumns(localPool, table);
  const remoteColumns = await getColumns(remotePool, table);
  const selectedColumns = remoteColumns.filter((column) => localColumns.includes(column));

  if (table === 'shareable_results' && remoteColumns.includes('view_count') && localColumns.includes('views_count')) {
    if (!selectedColumns.includes('view_count')) selectedColumns.push('view_count');
  }

  const sourceFields = selectedColumns.map((column) => {
    if (table === 'shareable_results' && column === 'view_count' && localColumns.includes('views_count')) {
      return 'COALESCE(`view_count`, `views_count`) AS `view_count`';
    }
    return `\`${column}\``;
  }).join(', ');
  const sourceQuery = table === 'User'
    ? `SELECT ${sourceFields} FROM \`${table}\`
       WHERE id NOT IN ('usr_superadmin_001', 'usr_user_001')
         AND email NOT IN ('superadmin@resizer.com', 'user@resizer.com')`
    : `SELECT ${sourceFields} FROM \`${table}\``;
  const [rows] = await localPool.query(sourceQuery);
  if (rows.length === 0) return 0;

  const columns = Object.keys(rows[0]);
  const columnList = columns.map((column) => `\`${column}\``).join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  const query = table === 'system_settings'
    ? `INSERT INTO \`${table}\` (${columnList}) VALUES (${placeholders})
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`
    : `INSERT IGNORE INTO \`${table}\` (${columnList}) VALUES (${placeholders})`;

  for (const row of rows) {
    await remotePool.query(query, columns.map((column) => row[column]));
  }

  return rows.length;
}

async function migrate() {
  if (!process.env.LOCAL_DB_PASSWORD) {
    throw new Error('LOCAL_DB_PASSWORD must be provided for the local source database.');
  }

  await localPool.query('SELECT 1');
  await remotePool.query('SELECT 1');

  for (const table of tables) {
    const count = await getCount(remotePool, table).catch(() => 0);
    if (count > 0 && process.env.ALLOW_EXISTING_REMOTE !== 'true') {
      throw new Error(`Remote table ${table} is not empty (${count} rows). Migration stopped without changing data.`);
    }
  }

  if (!(await initDb())) {
    throw new Error('Remote schema initialization failed.');
  }

  const copied = {};
  for (const table of tables) {
    copied[table] = await copyTable(table);
  }

  console.log('Migration completed:', JSON.stringify(copied));
}

migrate()
  .catch((error) => {
    console.error(`Migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await localPool.end();
    await remotePool.end();
  });
