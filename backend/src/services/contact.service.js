const { pool } = require('../config/db');

async function getSubmitter(userId) {
  const [rows] = await pool.query('SELECT name, email FROM User WHERE id = ? LIMIT 1', [userId]);
  return rows[0] || null;
}

async function createSubmission({ userId, name, email, subject, message }) {
  const [result] = await pool.query(
    `INSERT INTO contact_submissions (user_id, name, email, subject, message)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, name, email, subject, message]
  );
  return result.insertId;
}

async function listSubmissions({ cursor, limit }) {
  const whereClause = cursor ? 'WHERE id < ?' : '';
  const params = cursor ? [cursor, limit + 1] : [limit + 1];
  const [rows] = await pool.query(
    `SELECT id, user_id, name, email, subject, message, created_at
     FROM contact_submissions ${whereClause}
     ORDER BY id DESC
     LIMIT ?`,
    params
  );
  const hasMore = rows.length > limit;
  const submissions = rows.slice(0, limit);
  return {
    submissions,
    nextCursor: hasMore ? submissions[ submissions.length - 1 ].id : null,
  };
}

module.exports = {
  getSubmitter,
  createSubmission,
  listSubmissions,
};
