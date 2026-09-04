/**
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// Public analytics
router.get('/public', analyticsController.handleGetPublicAnalytics);
router.post('/track-event', analyticsController.handleTrackEvent);

// Admin only
router.get('/revenue', authenticateToken, requireRole('superadmin'), analyticsController.handleGetRevenueAnalytics);
router.get('/acquisition', authenticateToken, requireRole('superadmin'), analyticsController.handleGetUserAcquisition);

module.exports = router;
