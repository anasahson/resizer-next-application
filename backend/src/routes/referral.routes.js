/**
 * Referral Routes
 */

const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Protected routes
router.post('/generate', authenticateToken, referralController.handleGenerateReferral);
router.get('/stats', authenticateToken, referralController.handleGetReferralStats);
router.post('/withdraw', authenticateToken, referralController.handleWithdrawCommission);

// Public routes
router.post('/apply', referralController.handleApplyReferral);
router.get('/leaderboard', referralController.handleGetTopReferrers);

module.exports = router;
