/**
 * Share Routes
 */

const express = require('express');
const router = express.Router();
const shareController = require('../controllers/share.controller');
const { authenticateToken, optionalAuth } = require('../middleware/auth.middleware');

// Public & protected routes
router.post('/create', optionalAuth, shareController.handleCreateShare);
router.get('/user', authenticateToken, shareController.handleGetUserShares);
router.post('/track-share', shareController.handleTrackShare);
router.post('/:shareId/track-click', shareController.handleTrackUpgradeClick);

// Public route
router.get('/viral-stats', shareController.handleGetViralStats);
router.get('/:shareId', shareController.handleGetShareableResult);

module.exports = router;
