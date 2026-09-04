/**
 * Analytics Controller
 * Handles analytics and dashboard endpoints
 */

const analyticsService = require('../services/analytics.service');

/**
 * Track user event
 */
async function handleTrackEvent(req, res, next) {
  try {
    const { eventType, metadata } = req.body;
    await analyticsService.trackEvent(req.user?.id, eventType, metadata);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

/**
 * Get public dashboard analytics
 */
async function handleGetPublicAnalytics(req, res, next) {
  try {
    const analytics = await analyticsService.getDashboardAnalytics();
    res.json({
      success: true,
      analytics: {
        totalUsers: analytics.totalUsers,
        usersByPlan: analytics.usersByPlan,
        mrr: analytics.mrr,
        images: analytics.images,
        topFormats: analytics.topFormats,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get admin revenue analytics (protected)
 */
async function handleGetRevenueAnalytics(req, res, next) {
  try {
    const analytics = await analyticsService.getRevenueAnalytics();
    res.json({ success: true, analytics });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user acquisition metrics
 */
async function handleGetUserAcquisition(req, res, next) {
  try {
    const metrics = await analyticsService.getUserAcquisitionMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleTrackEvent,
  handleGetPublicAnalytics,
  handleGetRevenueAnalytics,
  handleGetUserAcquisition,
};
