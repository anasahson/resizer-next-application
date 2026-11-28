/**
 * Image Hosting Log
 *
 * Records every image hosting attempt so you can answer: where did it come
 * from (URL import vs system file), how long did it take, did it save, where
 * did it end up, and — if it failed — exactly why.
 *
 * Local deployments use append-only daily JSONL files. Set HOSTING_LOG_DB=1
 * to also persist rows in MySQL.
 *
 * Images themselves are never stored here (or anywhere in the database) — only
 * the hosted URL and the metadata around the attempt.
 */

const fs = require('node:fs');
const path = require('node:path');
const { pool, isDbAvailable } = require('../config/db');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs', 'hosting');
const PROVIDER = 'imgbb';

function dayStamp(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function ensureDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/** Append one JSON line to today's file. Never throws. */
function appendToFile(entry) {
  try {
    ensureDir();
    fs.appendFileSync(
      path.join(LOG_DIR, `hosting-${dayStamp()}.jsonl`),
      `${JSON.stringify(entry)}\n`,
      'utf8',
    );
    return true;
  } catch (err) {
    console.warn('[hosting-log] could not write log file:', err.message);
    return false;
  }
}

/**
 * Insert into MySQL when HOSTING_LOG_DB=1.
 */
async function insertToDb(entry) {
  if (process.env.HOSTING_LOG_DB !== '1') return false;
  if (!isDbAvailable()) return false;
  try {
    await pool.query(
      `INSERT INTO image_hosting_logs
         (source, provider, filename, status, url, error, duration_ms, size_bytes, mime_type, user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.source,
        entry.provider,
        entry.filename,
        entry.status,
        entry.url || null,
        entry.error || null,
        entry.durationMs ?? null,
        entry.sizeBytes ?? null,
        entry.mimeType || null,
        entry.userId || null,
        new Date(entry.timestamp),
      ],
    );
    return true;
  } catch (err) {
    console.warn('[hosting-log] could not write log row:', err.message);
    return false;
  }
}

/**
 * Log one hosting attempt.
 *
 * @param {Object} e
 * @param {'url-import'|'system-file'|'unknown'} e.source
 * @param {'saved'|'failed'} e.status
 * @param {string} [e.filename]
 * @param {string} [e.url]        final hosted url when saved
 * @param {string} [e.error]      reason when failed
 * @param {number} [e.durationMs] end-to-end server time
 * @param {number} [e.sizeBytes]
 * @param {string} [e.mimeType]
 * @param {string} [e.userId]
 */
async function logHostingEvent(e) {
  const entry = {
    timestamp: new Date().toISOString(),
    source: e.source || 'unknown',
    provider: PROVIDER,
    filename: e.filename || null,
    status: ['saved', 'deleted'].includes(e.status) ? e.status : 'failed',
    url: ['saved', 'deleted'].includes(e.status) ? e.url || null : null,
    error: e.status === 'failed' ? String(e.error || 'unknown error').slice(0, 500) : null,
    durationMs: typeof e.durationMs === 'number' ? e.durationMs : null,
    sizeBytes: typeof e.sizeBytes === 'number' ? e.sizeBytes : null,
    mimeType: e.mimeType || null,
    userId: e.userId || null,
  };

  appendToFile(entry);
  await insertToDb(entry);
  return entry;
}

/**
 * Recent log entries. MySQL is used when enabled; otherwise JSONL files are
 * read for local deployments.
 */
async function listHostingLogs({ limit = 100, status, source } = {}) {
  const capped = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 1000);

  if (process.env.HOSTING_LOG_DB === '1' && isDbAvailable()) {
    try {
      const where = [];
      const params = [];
      if (status) { where.push('status = ?'); params.push(status); }
      if (source) { where.push('source = ?'); params.push(source); }
      const [rows] = await pool.query(
        `SELECT id, created_at, source, provider, filename, status, url, error, duration_ms, size_bytes, mime_type, user_id
           FROM image_hosting_logs
           ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
          ORDER BY id DESC
          LIMIT ${capped}`,
        params,
      );
      return rows;
    } catch (err) {
      console.warn('[hosting-log] DB read failed, falling back to log files:', err.message);
    }
  }

  // Fallback: read the newest daily file(s).
  try {
    ensureDir();
    const files = fs.readdirSync(LOG_DIR).filter((f) => f.endsWith('.jsonl')).sort().reverse();
    const lines = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(LOG_DIR, file), 'utf8');
      lines.push(...content.split('\n').filter(Boolean).reverse());
      if (lines.length >= capped) break;
    }
    return lines
      .slice(0, capped)
      .map((l) => {
        const parsed = JSON.parse(l);
        return { ...parsed, id: null, created_at: parsed.timestamp };
      })
      .filter((l) => (!status || l.status === status) && (!source || l.source === source));
  } catch {
    return [];
  }
}

/** CSV export of the log (for spreadsheets / sharing). */
async function hostingLogsCsv(options = {}) {
  const rows = await listHostingLogs({ ...options, limit: 1000 });
  const header = ['created_at', 'source', 'provider', 'filename', 'status', 'url', 'error', 'duration_ms', 'size_bytes', 'mime_type'];
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(header.map((h) => esc(r[h] ?? null)).join(','));
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Saved-image history, rebuilt from the persistent host log.
 *
 * This replaces the old `stored_images` table: images live on imgbb and the
 * log is the only place their URLs are recorded. When `userId` is supplied
 * only that user's uploads are returned — anonymous entries are excluded so one
 * signed-in user can never see another user's links.
 */
async function listSavedImages({ userId = null, limit = 100 } = {}) {
  const capped = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 1000);

  if (process.env.HOSTING_LOG_DB === '1' && isDbAvailable()) {
    const [rows] = await pool.query(
      `SELECT saved.id, saved.filename, saved.mime_type, saved.size_bytes,
              saved.url, saved.created_at, saved.source, saved.duration_ms, saved.user_id
         FROM image_hosting_logs AS saved
        WHERE saved.status = 'saved'
          AND saved.url IS NOT NULL
          AND (? IS NULL OR saved.user_id = ?)
          AND NOT EXISTS (
            SELECT 1
              FROM image_hosting_logs AS deleted
             WHERE deleted.status = 'deleted'
               AND deleted.url = saved.url
               AND deleted.id > saved.id
          )
        ORDER BY saved.id DESC
        LIMIT ${capped}`,
      [userId, userId],
    );

    return rows.map((row) => ({
      id: row.id,
      filename: row.filename,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      url: row.url,
      source: row.source,
      durationMs: row.duration_ms,
      timestamp: row.created_at,
      userId: row.user_id,
    }));
  }

  try {
    ensureDir();
    const files = fs
      .readdirSync(LOG_DIR)
      .filter((f) => /^hosting-\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
      .sort()
      .reverse(); // newest day first

    const found = [];
    // The log is append-only, so a later `deleted` entry must cancel the earlier
    // `saved` one — otherwise removing an image from imgbb would still leave its
    // dead link in the saved list.
    const deletedUrls = new Set();

    for (const file of files) {
      const lines = fs.readFileSync(path.join(LOG_DIR, file), 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let entry;
        try {
          entry = JSON.parse(trimmed);
        } catch {
          continue; // ignore a torn line rather than fail the whole listing
        }
        if (entry.status === 'deleted') {
          if (entry.url) deletedUrls.add(entry.url);
          continue;
        }
        if (entry.status !== 'saved' || !entry.url) continue;
        if (userId != null && String(entry.userId) !== String(userId)) continue;
        found.push(entry);
      }
      if (found.length >= capped) break;
    }

    return found
      .filter((e) => !deletedUrls.has(e.url))
      .slice(0, capped)
      .map((e, i) => ({
      id: e.imageId || e.image_id || `log-${i}`,
      filename: e.filename || null,
      mimeType: e.mimeType || null,
      sizeBytes: e.sizeBytes ?? null,
      url: e.url,
      source: e.source || null,
      durationMs: e.durationMs ?? null,
      timestamp: e.timestamp || null,
      userId: e.userId ?? null,
    }));
  } catch {
    return [];
  }
}

/** Absolute path of today's log file. */
function currentLogFile() {
  return path.join(LOG_DIR, `hosting-${dayStamp()}.jsonl`);
}

module.exports = {
  logHostingEvent,
  listHostingLogs,
  listSavedImages,
  hostingLogsCsv,
  currentLogFile,
  PROVIDER,
};