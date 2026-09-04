/**
 * Subscription Routes
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Public endpoints
router.get('/plans', subscriptionController.handleGetPlans);
router.post('/webhook', subscriptionController.handleStripeWebhook);

// Protected endpoints (require authentication)
router.get('/current', authenticateToken, subscriptionController.handleGetSubscription);
router.post('/checkout', authenticateToken, subscriptionController.handleCreateCheckout);
router.patch('/upgrade', authenticateToken, subscriptionController.handleUpgradeSubscription);
router.delete('/cancel', authenticateToken, subscriptionController.handleCancelSubscription);
router.get('/portal', authenticateToken, subscriptionController.handleGetPortalSession);

module.exports = router;
