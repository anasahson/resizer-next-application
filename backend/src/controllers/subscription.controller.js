/**
 * Subscription Controller
 * Handles subscription management endpoints
 */

const subscriptionService = require('../services/subscription.service');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

/**
 * Get current user subscription
 */
async function handleGetSubscription(req, res, next) {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.user.id);
    const usage = await subscriptionService.getUserMonthlyUsage(req.user.id);
    const plan = subscriptionService.getPlanDetails(subscription?.plan_id || 'free');

    res.json({
      success: true,
      subscription: subscription || { plan_id: 'free', status: 'active' },
      plan,
      usage: {
        current: usage,
        limit: plan.imagesPerMonth,
        remaining: Math.max(0, plan.imagesPerMonth - usage),
        resetDate: subscription?.current_period_end,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all pricing plans
 */
async function handleGetPlans(req, res, next) {
  try {
    res.json({
      success: true,
      plans: subscriptionService.PLANS,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create checkout session for subscription
 */
async function handleCreateCheckout(req, res, next) {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'planId is required' });
    }

    const plan = subscriptionService.PLANS[planId];
    if (!plan || planId === 'free') {
      return res.status(400).json({ error: 'Invalid plan' });
    }
    if (!stripe || !plan.stripePriceId) {
      return res.status(503).json({ error: 'Stripe is not configured for this plan.' });
    }

    const user = await (async () => {
      const [rows] = await require('../config/db').pool.query('SELECT email FROM User WHERE id = ?', [req.user.id]);
      return rows[0];
    })();

    try {
      const session = await stripe.checkout.sessions.create({
        customer_email: user?.email,
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?upgraded=${planId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`,
        metadata: {
          userId: req.user.id,
          planId: planId,
        },
      });

      return res.json({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } catch (stripeErr) {
      console.error('Stripe checkout session failed:', stripeErr.message);
      return res.status(502).json({ error: 'Unable to create Stripe checkout session.' });
    }
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Unable to create checkout session.' });
  }
}

/**
 * Upgrade or downgrade subscription
 */
async function handleUpgradeSubscription(req, res, next) {
  try {
    const { newPlanId } = req.body;
    if (!newPlanId) {
      return res.status(400).json({ error: 'newPlanId is required' });
    }

    const result = await subscriptionService.upgradeSubscription(req.user.id, newPlanId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel subscription
 */
async function handleCancelSubscription(req, res, next) {
  try {
    const result = await subscriptionService.cancelSubscription(req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get Stripe portal session for managing subscription
 */
async function handleGetPortalSession(req, res, next) {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured.' });
    }

    const subscription = await subscriptionService.getUserSubscription(req.user.id);
    if (!subscription?.stripe_customer_id) {
      return res.status(400).json({ error: 'No active paid subscription' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
    });

    res.json({
      success: true,
      portalUrl: session.url,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Webhook endpoint for Stripe events
 */
async function handleStripeWebhook(req, res, next) {
  try {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(503).json({ error: 'Stripe webhook handling is not configured.' });
    }

    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    const result = await subscriptionService.handleStripeWebhook(event);
    res.json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Invalid webhook request.' });
  }
}

module.exports = {
  handleGetSubscription,
  handleGetPlans,
  handleCreateCheckout,
  handleUpgradeSubscription,
  handleCancelSubscription,
  handleGetPortalSession,
  handleStripeWebhook,
};
