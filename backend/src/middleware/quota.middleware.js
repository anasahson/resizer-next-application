/**
 * Quota Enforcement Middleware
 * Checks if user has remaining quota before processing image
 */

const subscriptionService = require('../services/subscription.service');

/**
 * Middleware to check if user can process image
 */
async function enforceQuota(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const quotaInfo = await subscriptionService.canUserProcessImage(userId);

    if (!quotaInfo.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Quota exceeded',
        message: `You have reached your limit of ${quotaInfo.limit} images per month. Upgrade to continue.`,
        quotaInfo,
      });
    }

    // Attach quota info to request for logging
    req.quotaInfo = quotaInfo;
    next();
  } catch (error) {
    console.error('Quota enforcement error:', error);
    res.status(500).json({ error: 'Quota check failed' });
  }
}

/**
 * Optional middleware for free tier quota check
 */
async function checkQuotaOptional(req, res, next) {
  try {
    const userId = req.user?.id;

    if (userId) {
      const quotaInfo = await subscriptionService.canUserProcessImage(userId);
      req.quotaInfo = quotaInfo;
      req.isQuotaExceeded = !quotaInfo.allowed;
    }

    next();
  } catch (error) {
    console.error('Quota check error:', error);
    next();
  }
}

module.exports = {
  enforceQuota,
  checkQuotaOptional,
};
