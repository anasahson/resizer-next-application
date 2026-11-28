const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const healthRoutes = require('./routes/health.routes');
const imageRoutes = require('./routes/image.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const blogRoutes = require('./routes/blog.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const shareRoutes = require('./routes/share.routes');
const referralRoutes = require('./routes/referral.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const exportRoutes = require('./routes/export.routes');
const storageRoutes = require('./routes/storage.routes');
const contactRoutes = require('./routes/contact.routes');
const { trackException } = require('./services/posthog.service');

const app = express();
if (process.env.TRUST_PROXY === '1' || process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
  throw new Error('CORS_ORIGIN must be configured in production.');
}

const normalizeOrigin = (value) => (value || '').trim().replace(/\/+$/, '');

const configuredOrigins = [
  ...(process.env.CORS_ORIGIN || '').split(','),
  process.env.FRONTEND_URL || '',
]
  .map(normalizeOrigin)
  .filter(Boolean);

const defaultLocalOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultLocalOrigins]));

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalized)) return true;
  // Always permit local development origins on any port
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
    return true;
  }
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition', 'X-Original-Size', 'X-Processed-Size', 'X-Processing-Time-Ms'],
    credentials: true,
  })
);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(morgan('dev'));
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'TooManyRequests', message: 'Too many authentication attempts. Please try again later.' },
});

const getApiData = () => ({
  name: 'Resizer API Engine',
  status: 'online',
  version: '1.0.0',
  documentation: 'https://resizora.com',
  endpoints: {
    health: { method: 'GET', path: '/api/health', desc: 'System health & database status' },
    images: {
      batch: { method: 'POST', path: '/api/images/batch', desc: 'Batch image resize/convert (multipart)', getDocs: true },
      process: { method: 'POST', path: '/api/images/process', desc: 'Single image resize/convert (multipart)', getDocs: true },
      metadata: { method: 'POST', path: '/api/images/metadata', desc: 'Extract EXIF & dimensions (multipart)', getDocs: true },
      removeBackground: { method: 'POST', path: '/api/images/remove-background', desc: 'Remove an image background (authenticated, allowlisted provider use)' },
      removeBackgroundStatus: { method: 'GET', path: '/api/images/remove-background/status', desc: 'Check whether background removal is enabled for the authenticated account' },
    },
    auth: {
      login: { method: 'POST', path: '/api/auth/login', desc: 'User login & JWT token' },
      register: { method: 'POST', path: '/api/auth/register', desc: 'User account creation' },
      profile: { method: 'GET', path: '/api/auth/me', desc: 'Current user profile (Auth required)' },
      updateProfile: { method: 'PATCH', path: '/api/auth/profile', desc: 'Update profile details (Auth required)' },
    },
    dashboard: {
      stats: { method: 'GET', path: '/api/dashboard/stats', desc: 'Live metrics & compression volume' },
      jobs: { method: 'GET', path: '/api/dashboard/jobs', desc: 'Recent processed jobs log' },
    },
    blog: {
      posts: { method: 'GET', path: '/api/blog/posts', desc: 'Published articles with pagination' },
      postBySlug: { method: 'GET', path: '/api/blog/posts/:slug', desc: 'Single article by slug' },
    },
    subscription: {
      plans: { method: 'GET', path: '/api/subscription/plans', desc: 'Available pricing tiers' },
      current: { method: 'GET', path: '/api/subscription/current', desc: 'Active subscription (Auth required)' },
      checkout: { method: 'POST', path: '/api/subscription/checkout', desc: 'Create Stripe session (Auth required)' },
    },
    share: {
      create: { method: 'POST', path: '/api/share/create', desc: 'Create viral share card', getDocs: true },
      view: { method: 'GET', path: '/api/share/:shareId', desc: 'Fetch shareable result' },
      viralStats: { method: 'GET', path: '/api/share/viral-stats', desc: 'Top shared results leaderboard' },
    },
    referral: {
      leaderboard: { method: 'GET', path: '/api/referral/leaderboard', desc: 'Top affiliate earners' },
      apply: { method: 'POST', path: '/api/referral/apply', desc: 'Apply referral code' },
      stats: { method: 'GET', path: '/api/referral/stats', desc: 'Affiliate commission stats' },
    },
    analytics: {
      public: { method: 'GET', path: '/api/analytics/public', desc: 'Platform usage totals' },
      track: { method: 'POST', path: '/api/analytics/track-event', desc: 'Telemetry event ingestion' },
    },
    storage: {
      upload: { method: 'POST', path: '/api/storage/upload', desc: 'Save processed image to imgbb (hosting metadata is logged)' },
      image: { method: 'GET', path: '/api/storage/:id/image', desc: 'Permanent public image URL (redirects to the CDN)' },
      mine: { method: 'GET', path: '/api/storage/images', desc: 'Saved images for the signed-in user (Auth required)' },
      delete: { method: 'DELETE', path: '/api/storage/:id', desc: 'Forget a saved image record (Auth required)' },
      status: { method: 'GET', path: '/api/storage/status', desc: 'Hosting & database readiness probe' },
    },
    export: {
      imgbb: { method: 'POST', path: '/api/export/imgbb', desc: 'Upload a processed image to imgbb' },
    },
  },
});

const sendApiIndex = (req, res) => {
  const data = getApiData();
  const acceptsHtml = req.accepts('html') && !req.xhr && req.headers['sec-fetch-dest'] === 'document';

  if (acceptsHtml) {
    const rows = [];
    Object.entries(data.endpoints).forEach(([cat, val]) => {
      if (val.method) {
        rows.push({ cat, ...val });
      } else {
        Object.entries(val).forEach(([sub, subVal]) => {
          rows.push({ cat: `${cat}.${sub}`, ...subVal });
        });
      }
    });

    const methodColor = (m) => {
      if (m === 'GET') return '#3b82f6';
      if (m === 'POST') return '#10b981';
      if (m === 'PATCH' || m === 'PUT') return '#f59e0b';
      return '#ef4444';
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resizer API Engine — Developer Portal</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #f4f4f5; line-height: 1.5; padding: 2rem 1rem; }
    .container { max-width: 900px; margin: 0 auto; }
    header { border-bottom: 1px solid #27272a; padding-bottom: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #fafafa; display: flex; align-items: center; gap: 0.5rem; }
    .badge-status { background: #064e3b; color: #34d399; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 9999px; font-weight: 600; text-transform: uppercase; }
    .table-card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
    th { background: #27272a; padding: 0.75rem 1rem; font-size: 0.75rem; text-transform: uppercase; color: #a1a1aa; letter-spacing: 0.05em; }
    td { padding: 0.75rem 1rem; border-top: 1px solid #27272a; vertical-align: middle; }
    tr:hover td { background: #202024; }
    .method-badge { font-weight: 700; font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 4px; display: inline-block; min-width: 48px; text-align: center; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85rem; color: #e4e4e7; }
    a.path-link { color: #60a5fa; text-decoration: none; font-weight: 500; }
    a.path-link:hover { text-decoration: underline; }
    .desc { color: #a1a1aa; }
    footer { margin-top: 2rem; text-align: center; color: #71717a; font-size: 0.8rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>⚡ Resizer API Engine <span class="badge-status">● Online</span></h1>
        <p style="color:#a1a1aa; font-size: 0.875rem; margin-top: 0.25rem;">High-performance image processing, conversion, and monetization services</p>
      </div>
      <div>
        <a href="/api/health" style="color: #60a5fa; font-size: 0.875rem; text-decoration: none; border: 1px solid #3b82f6; padding: 0.35rem 0.75rem; border-radius: 6px;">Check Health &rarr;</a>
      </div>
    </header>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((r) => `
            <tr>
              <td>
                <span class="method-badge" style="background:${methodColor(r.method)}22; color:${methodColor(r.method)}; border:1px solid ${methodColor(r.method)}55;">
                  ${r.method}
                </span>
              </td>
              <td>
                <a class="path-link" href="${r.path.replace(/:[a-zA-Z]+/g, 'sample')}">
                  <code>${r.path}</code>
                </a>
              </td>
              <td class="desc">${r.desc}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <footer>
      Resizer Engine v1.0.0 &bull; <a href="https://resizora.com" style="color:#71717a;">Resizora</a> &bull; JSON format available via <code>Accept: application/json</code>
    </footer>
  </div>
</body>
</html>`;
    return res.send(html);
  }

  return res.json(data);
};

// Protected API Portal HTTP Basic Authentication
const protectApiPortal = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const expectedUser = process.env.API_DOCS_USER;
  const expectedPass = process.env.API_DOCS_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return res.status(503).json({
      error: 'ServiceUnavailable',
      message: 'The API portal is unavailable until API_DOCS_USER and API_DOCS_PASSWORD are configured.',
    });
  }

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Protected Resizer API Portal"');
    return res.status(401).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Authentication Required</title></head>
      <body style="background:#09090b;color:#f4f4f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;max-width:380px;padding:2rem;background:#18181b;border:1px solid #27272a;border-radius:12px;">
          <h2 style="color:#ef4444;margin-bottom:0.5rem;">🔒 Protected API Portal</h2>
          <p style="color:#a1a1aa;font-size:0.9rem;">Sign in with your administrator credentials to access the API Explorer.</p>
          <button onclick="location.reload()" style="margin-top:1.25rem;background:#3b82f6;color:white;border:none;padding:0.6rem 1.25rem;border-radius:6px;cursor:pointer;font-weight:600;">Sign In</button>
        </div>
      </body>
      </html>
    `);
  }

  const base64Credentials = authHeader.split(' ')[1];
  const decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const colonIndex = decoded.indexOf(':');
  const user = decoded.substring(0, colonIndex);
  const pass = decoded.substring(colonIndex + 1);

  const isUserValid = user === expectedUser;
  const isPassValid = pass === expectedPass;

  if (isUserValid && isPassValid) {
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="Protected Resizer API Portal"');
  return res.status(401).send('Invalid credentials. Access denied.');
};

// Root & /api welcome routes (Protected with Basic Auth alert)
app.get('/', protectApiPortal, sendApiIndex);
app.get('/api', protectApiPortal, sendApiIndex);

// API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/contact', contactRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    hint: 'Check the requested URL and HTTP method (GET vs POST). Visit GET / for the list of available endpoints.',
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]:', err.message || err);

  const statusCode = err.code === 'LIMIT_FILE_SIZE'
    ? 413
    : (err.status || err.statusCode || 500);

  // Report server-side 5xx to PostHog Error Tracking (best-effort; the
  // trackException call never throws).
  if (statusCode >= 500) {
    try {
      trackException({
        distinctId: req.user?.id != null ? String(req.user.id) : 'anonymous',
        source: 'backend-express',
        type: err.name || 'Error',
        message: err.message,
        stack: err.stack,
        extra: { status: statusCode, method: req.method, path: req.originalUrl },
      });
    } catch { /* observability must never break the response */ }
  }

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'InternalServerError' : (err.name || 'RequestError'),
    message: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred during processing.'
      : (err.message || 'An unexpected error occurred during processing'),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
