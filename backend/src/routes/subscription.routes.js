/**
 * Subscription Routes
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Public endpoints
router.get('/plans', subscriptionController.handleGetPlans);
router.get('/webhook', (req, res) => {
  res.json({
    endpoint: '/api/subscription/webhook',
    method: 'POST',
    description: 'Stripe webhook receiver for asynchronous subscription events',
  });
});
router.post('/webhook', subscriptionController.handleStripeWebhook);

// Protected endpoints (require authentication)
router.get('/current', authenticateToken, subscriptionController.handleGetSubscription);
router.get('/checkout', (req, res) => {
  res.json({
    endpoint: '/api/subscription/checkout',
    method: 'POST',
    auth: 'Bearer <token> required',
    description: 'Create a Stripe Checkout session to upgrade plan',
    contentType: 'application/json',
    body: { planId: "'pro' | 'business' (required)" },
  });
});
router.post('/checkout', authenticateToken, subscriptionController.handleCreateCheckout);
router.patch('/upgrade', authenticateToken, subscriptionController.handleUpgradeSubscription);
router.delete('/cancel', authenticateToken, subscriptionController.handleCancelSubscription);
router.get('/portal', authenticateToken, subscriptionController.handleGetPortalSession);

module.exports = router;
