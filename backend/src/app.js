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

const app = express();

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

// Root API welcome route
app.get('/', (req, res) => {
  res.json({
    name: 'Resizer API Engine',
    status: 'online',
    version: '1.0.0',
    documentation: 'https://resizora.com',
    endpoints: {
      health: 'GET /api/health',
      images: {
        batch: 'POST /api/images/batch (multipart/form-data with "images" field, or GET for docs)',
        process: 'POST /api/images/process (multipart/form-data with "image" field, or GET for docs)',
        metadata: 'POST /api/images/metadata (multipart/form-data with "image" field, or GET for docs)',
      },
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        profile: 'GET /api/auth/me',
        updateProfile: 'PATCH /api/auth/profile',
      },
      dashboard: {
        stats: 'GET /api/dashboard/stats',
        jobs: 'GET /api/dashboard/jobs',
      },
      blog: {
        posts: 'GET /api/blog/posts',
        postBySlug: 'GET /api/blog/posts/:slug',
      },
      subscription: {
        plans: 'GET /api/subscription/plans',
        current: 'GET /api/subscription/current',
        checkout: 'POST /api/subscription/checkout',
      },
      share: {
        create: 'POST /api/share/create (or GET for docs)',
        view: 'GET /api/share/:shareId',
        viralStats: 'GET /api/share/viral-stats',
      },
      referral: {
        leaderboard: 'GET /api/referral/leaderboard',
        apply: 'POST /api/referral/apply',
        stats: 'GET /api/referral/stats',
      },
      analytics: {
        public: 'GET /api/analytics/public',
        track: 'POST /api/analytics/track-event',
      },
      admin: {
        posts: '/api/admin/posts',
        aiSettings: '/api/admin/settings/ai',
        aiGeneratePost: 'POST /api/admin/ai/generate-post',
        aiGenerateImage: 'POST /api/admin/ai/generate-image',
      },
    },
  });
});

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

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode >= 500 ? 'InternalServerError' : (err.name || 'RequestError'),
    message: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred during processing.'
      : (err.message || 'An unexpected error occurred during processing'),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
