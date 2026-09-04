/**
 * Share Controller
 * Handles shareable result endpoints
 */

const shareService = require('../services/share.service');
const imageController = require('./image.controller');

/**
 * Create shareable result after image processing
 */
async function handleCreateShare(req, res, next) {
  try {
    const { imageData } = req.body;
    if (!imageData) {
      return res.status(400).json({ error: 'imageData is required' });
    }

    const userId = req.user?.id || null;
    const result = await shareService.createShareableResult(userId, imageData);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get shareable result by ID (public)
 */
async function handleGetShareableResult(req, res, next) {
  try {
    const { shareId } = req.params;
    const result = await shareService.getShareableResult(shareId);

    if (!result) {
      return res.status(404).json({ error: 'Share expired or not found' });
    }

    res.json({
      success: true,
      result: {
        ...result,
        cta: 'Try it free - compress your images now!',
        upgradeUrl: `${process.env.FRONTEND_URL}/pricing`,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's shared results
 */
async function handleGetUserShares(req, res, next) {
  try {
    const results = await shareService.getUserSharedResults(req.user.id);
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
}

/**
 * Get viral leaderboard
 */
async function handleGetViralStats(req, res, next) {
  try {
    const stats = await shareService.getViralStats();
    res.json({ success: true, leaderboard: stats });
  } catch (error) {
    next(error);
  }
}

/**
 * Track share on social media
 */
async function handleTrackShare(req, res, next) {
  try {
    const { shareId, platform } = req.body;
    await shareService.trackShare(shareId, platform || 'unknown');
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * Track upgrade CTA click
 */
async function handleTrackUpgradeClick(req, res, next) {
  try {
    const { shareId } = req.params;
    await shareService.trackUpgradeClick(shareId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleCreateShare,
  handleGetShareableResult,
  handleGetUserShares,
  handleGetViralStats,
  handleTrackShare,
  handleTrackUpgradeClick,
};
