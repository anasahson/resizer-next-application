/**
 * Referral Routes
 */

const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Protected routes
router.get('/generate', (req, res) => {
  res.json({
    endpoint: '/api/referral/generate',
    method: 'POST',
    auth: 'Bearer <token> required',
    description: 'Generate a unique referral code and tracking link for the current user',
  });
});
router.post('/generate', authenticateToken, referralController.handleGenerateReferral);
router.get('/stats', authenticateToken, referralController.handleGetReferralStats);
router.get('/withdraw', (req, res) => {
  res.json({
    endpoint: '/api/referral/withdraw',
    method: 'POST',
    auth: 'Bearer <token> required',
    description: 'Request a withdrawal of accrued referral commission balance',
    body: { amount: 'number (required)' },
  });
});
router.post('/withdraw', authenticateToken, referralController.handleWithdrawCommission);

// Public routes
router.get('/apply', (req, res) => {
  res.json({
    endpoint: '/api/referral/apply',
    method: 'POST',
    description: 'Apply an invitation or referral code during signup',
    body: { referralCode: 'string (required)' },
  });
});
router.post('/apply', referralController.handleApplyReferral);
router.get('/leaderboard', referralController.handleGetTopReferrers);

module.exports = router;
