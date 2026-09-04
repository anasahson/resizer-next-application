/**
 * Referral Controller
 * Handles referral program endpoints
 */

const referralService = require('../services/referral.service');

/**
 * Generate referral code
 */
async function handleGenerateReferral(req, res, next) {
  try {
    const result = await referralService.generateReferralCode(req.user.id);
    const stats = await referralService.getReferralStats(req.user.id);
    res.json({ success: true, ...stats });
  } catch (error) {
    next(error);
  }
}

/**
 * Get referral stats
 */
async function handleGetReferralStats(req, res, next) {
  try {
    const stats = await referralService.getReferralStats(req.user.id);
    res.json({ success: true, ...stats });
  } catch (error) {
    next(error);
  }
}

/**
 * Apply referral code (public)
 */
async function handleApplyReferral(req, res, next) {
  try {
    const { referralCode, userId } = req.body;
    const result = await referralService.applyReferralCode(referralCode, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get top referrers leaderboard
 */
async function handleGetTopReferrers(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topReferrers = await referralService.getTopReferrers(limit);
    res.json({ success: true, topReferrers });
  } catch (error) {
    next(error);
  }
}

/**
 * Withdraw commission
 */
async function handleWithdrawCommission(req, res, next) {
  try {
    const { amount } = req.body;
    if (!amount || amount < 10) {
      return res.status(400).json({ error: 'Minimum withdrawal is $10' });
    }

    const result = await referralService.withdrawCommission(req.user.id, amount);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleGenerateReferral,
  handleGetReferralStats,
  handleApplyReferral,
  handleGetTopReferrers,
  handleWithdrawCommission,
};
