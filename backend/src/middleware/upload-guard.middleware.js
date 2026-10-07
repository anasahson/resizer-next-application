const rateLimit = require('express-rate-limit');

/**
 * Upload guards.
 *
 * Auto-hosting means every processed image hits the image API, so under load
 * (many users processing at once) we would otherwise fire dozens of
 * simultaneous upstream uploads — exactly what makes imgbb respond slowly or
 * with "You have been forbidden to use this website".
 *
 * Two layers, deliberately simple:
 *  1. uploadLimiter — a per-IP budget, so one client cannot flood us.
 *  2. uploadGate    — a concurrency gate: extra requests wait in a short
 *     in-process queue instead of all hitting the provider at the same time.
 *     If the queue is full or a request waits too long it gets a 503 rather
 *     than piling on (the client queue retries with backoff anyway).
 */

/** Per-IP upload budget. */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // Signed-in users get their own bucket so a shared NAT IP is less punishing.
  keyGenerator: (req) => {
    const userId = req.user && req.user.id;
    return userId ? `u:${userId}` : `ip:${req.ip}`;
  },
  message: {
    success: false,
    error: 'TooManyRequests',
    message: 'Too many upload requests from your session. Please wait a moment and try again.',
  },
});

/**
 * Concurrency gate: at most `max` upstream uploads in flight at once; the
 * rest wait. Requests wait at most `waitMs`, then get a 503 so the client's
 * own retry/backoff queue can pick them up later.
 */
function createUploadGate({ max = 3, maxQueue = 40, waitMs = 20000 } = {}) {
  let active = 0;
  const waiting = [];

  const release = () => {
    active = Math.max(0, active - 1);
    const next = waiting.shift();
    if (next) next();
  };

  return function uploadGate(req, res, next) {
    const onSettled = (() => {
      let done = false;
      return () => {
        if (done) return;
        done = true;
        release();
      };
    })();

    // Starts the upload and accounts for it as in-flight until the response ends.
    const begin = () => {
      active += 1;
      res.on('finish', onSettled);
      res.on('close', onSettled);
      next();
    };

    if (active < max) return begin();

    if (waiting.length >= maxQueue) {
      return res.status(503).json({
        success: false,
        error: 'ServerBusy',
        message: 'The upload queue is full. Please retry in a moment.',
      });
    }

    let released = false;
    let timer = null;

    // Dequeued later; no-ops if the wait timer already answered the client.
    const entry = () => {
      if (released) return;
      released = true;
      if (timer) clearTimeout(timer);
      begin();
    };

    timer = setTimeout(() => {
      if (released) return;
      released = true;
      const idx = waiting.indexOf(entry);
      if (idx !== -1) waiting.splice(idx, 1);
      res.status(503).json({
        success: false,
        error: 'ServerBusy',
        message: 'Upload service is busy — your request waited too long. It will retry automatically.',
      });
    }, waitMs);
    if (typeof timer.unref === 'function') timer.unref();

    waiting.push(entry);
    return undefined;
  };
}

/** One shared gate for both upload endpoints. */
const uploadGate = createUploadGate({
  max: Number(process.env.UPLOAD_CONCURRENCY) || 3,
  maxQueue: Number(process.env.UPLOAD_QUEUE_MAX) || 40,
  waitMs: Number(process.env.UPLOAD_QUEUE_WAIT_MS) || 20000,
});

module.exports = { uploadLimiter, uploadGate, createUploadGate };