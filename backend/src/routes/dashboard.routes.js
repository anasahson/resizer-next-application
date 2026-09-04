const express = require('express');
const router = express.Router();
const {
  getStats,
  getJobs,
  handleClearJobs,
  getSystemInfo,
} = require('../controllers/dashboard.controller');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth.middleware');

// Dashboard metrics and logs
router.get('/stats', optionalAuth, getStats);
router.get('/jobs', optionalAuth, getJobs);

// SuperAdmin Restricted Endpoints
router.get('/system', authenticateToken, requireRole('superadmin'), getSystemInfo);
router.delete('/jobs', authenticateToken, requireRole('superadmin'), handleClearJobs);

module.exports = router;
