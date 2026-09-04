/**
 * Subscription Service - Stripe Integration
 * Handles subscription creation, upgrades, cancellations, and webhooks
 */

const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const { pool } = require('../config/db');

// Pricing tiers
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    imagesPerMonth: 5,
    features: ['Basic compression', 'Max 5 images/month', 'WebP format only'],
  },
  pro: {
    name: 'Pro',
    price: 999, // $9.99 in cents
    imagesPerMonth: 500,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    features: ['Advanced compression', '500 images/month', 'All formats', 'Watermark removal', 'Priority support'],
  },
  business: {
    name: 'Business',
    price: 4999, // $49.99 in cents
    imagesPerMonth: 99999, // Unlimited
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS,
    features: ['Unlimited images', 'All features', 'API access', 'Dedicated support', 'Custom branding'],
  },
};

/**
 * Get user subscription details
 */
async function getUserSubscription(userId) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM subscriptions WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
}

/**
 * Create subscription (free or paid)
 */
async function createSubscription(userId, planId) {
  try {
    if (!PLANS[planId]) {
      throw new Error('Invalid plan ID');
    }

    // If free plan, just create database record
    if (planId === 'free') {
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
         VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))
         ON DUPLICATE KEY UPDATE plan_id = ?, status = 'active'`,
        [userId, planId, 'active', planId]
      );
      return {
        success: true,
        message: 'Free subscription activated',
        plan: PLANS[planId],
      };
    }

    if (!stripe || !PLANS[planId].stripePriceId) {
      throw new Error('Stripe is not configured for this plan. Set the required Stripe environment variables.');
    }

    // For paid plans, return Stripe info for frontend checkout
    return {
      success: true,
      stripePriceId: PLANS[planId].stripePriceId,
      plan: PLANS[planId],
      amount: PLANS[planId].price,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Handle successful Stripe payment
 */
async function handlePaymentSuccess(userId, planId, stripeSubscriptionId, stripeCustomerId) {
  try {
    await pool.query(
      `INSERT INTO subscriptions (user_id, plan_id, stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end)
       VALUES (?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))
       ON DUPLICATE KEY UPDATE plan_id = ?, stripe_subscription_id = ?, stripe_customer_id = ?, status = 'active'`,
      [userId, planId, stripeSubscriptionId, stripeCustomerId, 'active', planId, stripeSubscriptionId, stripeCustomerId]
    );

    return { success: true, message: 'Subscription updated successfully' };
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

/**
 * Upgrade subscription plan
 */
async function upgradeSubscription(userId, newPlanId) {
  try {
    if (!PLANS[newPlanId]) {
      throw new Error('Invalid plan ID');
    }

    const currentSub = await getUserSubscription(userId);
    if (!currentSub) {
      return createSubscription(userId, newPlanId);
    }

    // If upgrading from free to paid
    if (currentSub.plan_id === 'free' && newPlanId !== 'free') {
      if (!stripe || !PLANS[newPlanId].stripePriceId) {
        throw new Error('Stripe is not configured for this plan. Set the required Stripe environment variables.');
      }

      return {
        success: true,
        stripePriceId: PLANS[newPlanId].stripePriceId,
        plan: PLANS[newPlanId],
        action: 'checkout',
      };
    }

    // If already paid, return info for portal
    if (currentSub.stripe_subscription_id) {
      return {
        success: true,
        message: 'Use Stripe Customer Portal to manage subscription',
        action: 'portal',
      };
    }

    // Otherwise just update in database
    await pool.query(
      `UPDATE subscriptions SET plan_id = ? WHERE user_id = ?`,
      [newPlanId, userId]
    );

    return { success: true, message: 'Plan upgraded successfully' };
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
async function cancelSubscription(userId) {
  try {
    const currentSub = await getUserSubscription(userId);
    if (!currentSub) {
      throw new Error('No active subscription found');
    }

    if (currentSub.stripe_subscription_id) {
      if (!stripe) {
        throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY before managing paid subscriptions.');
      }
      try {
        await stripe.subscriptions.del(currentSub.stripe_subscription_id);
      } catch (err) {
        console.error('Stripe cancellation error:', err);
      }
    }

    // Revert to free plan
    await pool.query(
      `UPDATE subscriptions SET plan_id = ?, stripe_subscription_id = NULL, status = ? WHERE user_id = ?`,
      ['free', 'canceled', userId]
    );

    return {
      success: true,
      message: 'Subscription canceled. You have been downgraded to Free plan.',
    };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Handle Stripe webhook events
 */
async function handleStripeWebhook(event) {
  try {
    switch (event.type) {
      case 'customer.subscription.updated':
        const updatedSub = event.data.object;
        await pool.query(
          `UPDATE subscriptions SET status = ? WHERE stripe_subscription_id = ?`,
          [updatedSub.status, updatedSub.id]
        );
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object;
        await pool.query(
          `UPDATE subscriptions SET plan_id = ?, status = ? WHERE stripe_subscription_id = ?`,
          ['free', 'canceled', deletedSub.id]
        );
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        await pool.query(
          `UPDATE subscriptions SET last_payment_date = NOW() WHERE stripe_customer_id = ?`,
          [invoice.customer]
        );
        break;

      case 'invoice.payment_failed':
        console.error('⚠️ Payment failed for customer:', event.data.object.customer);
        break;
    }
    return { received: true };
  } catch (error) {
    console.error('Webhook processing error:', error);
    throw error;
  }
}

/**
 * Get user's monthly usage
 */
async function getUserMonthlyUsage(userId) {
  try {
    const [result] = await pool.query(
      `SELECT COUNT(*) as count FROM image_jobs 
       WHERE user_id = ? AND status = 'completed' 
       AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
      [userId]
    );
    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error fetching usage:', error);
    return 0;
  }
}

/**
 * Check if user can process image
 */
async function canUserProcessImage(userId) {
  try {
    let subscription = await getUserSubscription(userId);

    // If no subscription, create free tier
    if (!subscription) {
      await createSubscription(userId, 'free');
      subscription = await getUserSubscription(userId);
    }

    const plan = PLANS[subscription.plan_id] || PLANS.free;
    const usage = await getUserMonthlyUsage(userId);
    const remaining = Math.max(0, plan.imagesPerMonth - usage);

    return {
      allowed: remaining > 0,
      remaining,
      plan: subscription.plan_id,
      limit: plan.imagesPerMonth,
      usage,
      resetDate: new Date(subscription.current_period_end),
    };
  } catch (error) {
    console.error('Error checking quota:', error);
    return { allowed: false, error: error.message };
  }
}

/**
 * Get plan details
 */
function getPlanDetails(planId) {
  return PLANS[planId] || PLANS.free;
}

module.exports = {
  PLANS,
  getUserSubscription,
  createSubscription,
  handlePaymentSuccess,
  upgradeSubscription,
  cancelSubscription,
  handleStripeWebhook,
  getUserMonthlyUsage,
  canUserProcessImage,
  getPlanDetails,
};
