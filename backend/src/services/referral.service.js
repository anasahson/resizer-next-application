/**
 * Referral Program Service
 * Manages referral codes, tracking, and rewards
 */

const { pool } = require('../config/db');
const crypto = require('crypto');

/**
 * Generate referral code for user
 */
async function generateReferralCode(userId) {
  try {
    const [existing] = await pool.query(
      `SELECT referral_code FROM referrals WHERE referrer_id = ?`,
      [userId]
    );

    if (existing.length > 0) {
      return { referralCode: existing[0].referral_code };
    }

    const referralCode = `RESIZE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    await pool.query(
      `INSERT INTO referrals (referrer_id, referral_code, commission_earned, referral_count, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, referralCode, 0, 0]
    );

    return { referralCode };
  } catch (error) {
    console.error('Error generating referral code:', error);
    throw error;
  }
}

/**
 * Apply referral code when user signs up
 */
async function applyReferralCode(referralCode, newUserId) {
  try {
    const [rows] = await pool.query(
      `SELECT referrer_id FROM referrals WHERE referral_code = ?`,
      [referralCode]
    );

    if (rows.length === 0) {
      return { success: false, message: 'Invalid referral code' };
    }

    const referrerId = rows[0].referrer_id;

    // Record referral
    await pool.query(
      `INSERT INTO referral_clicks (referrer_id, referred_user_id, status, created_at)
       VALUES (?, ?, ?, NOW())`,
      [referrerId, newUserId, 'signup']
    );

    // Update referral count
    await pool.query(
      `UPDATE referrals SET referral_count = referral_count + 1 WHERE referrer_id = ?`,
      [referrerId]
    );

    return { success: true, message: 'Referral applied' };
  } catch (error) {
    console.error('Error applying referral code:', error);
    throw error;
  }
}

/**
 * Track referral conversion (when referred user upgrades)
 */
async function trackReferralConversion(referredUserId, planId, amount) {
  try {
    const [rows] = await pool.query(
      `SELECT referrer_id FROM referral_clicks WHERE referred_user_id = ? LIMIT 1`,
      [referredUserId]
    );

    if (rows.length === 0) {
      return { success: false };
    }

    const referrerId = rows[0].referrer_id;
    const commission = Math.floor(amount * 0.1); // 10% commission

    // Record conversion
    await pool.query(
      `UPDATE referral_clicks SET status = ?, conversion_amount = ? WHERE referred_user_id = ?`,
      ['converted', amount, referredUserId]
    );

    // Add commission
    await pool.query(
      `UPDATE referrals SET commission_earned = commission_earned + ? WHERE referrer_id = ?`,
      [commission, referrerId]
    );

    return {
      success: true,
      commission,
      referrerId,
    };
  } catch (error) {
    console.error('Error tracking referral conversion:', error);
    throw error;
  }
}

/**
 * Get referral stats for user
 */
async function getReferralStats(userId) {
  try {
    const [refRows] = await pool.query(
      `SELECT referral_code, commission_earned, referral_count FROM referrals WHERE referrer_id = ?`,
      [userId]
    );

    if (refRows.length === 0) {
      await generateReferralCode(userId);
      return {
        referralCode: null,
        commissionEarned: 0,
        referralCount: 0,
        conversions: 0,
      };
    }

    const [conversions] = await pool.query(
      `SELECT COUNT(*) as count FROM referral_clicks WHERE referrer_id = ? AND status = 'converted'`,
      [userId]
    );

    return {
      referralCode: refRows[0].referral_code,
      commissionEarned: refRows[0].commission_earned,
      referralCount: refRows[0].referral_count,
      conversions: conversions[0].count,
      referralUrl: `${process.env.FRONTEND_URL}?ref=${refRows[0].referral_code}`,
    };
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    throw error;
  }
}

/**
 * Get top referrers (leaderboard)
 */
async function getTopReferrers(limit = 10) {
  try {
    const [rows] = await pool.query(
      `SELECT r.referrer_id, r.referral_code, r.commission_earned, r.referral_count,
              u.name, u.email,
              COUNT(CASE WHEN rc.status = 'converted' THEN 1 END) as conversions
       FROM referrals r
       LEFT JOIN User u ON r.referrer_id = u.id
       LEFT JOIN referral_clicks rc ON r.referrer_id = rc.referrer_id
       GROUP BY r.referrer_id, r.referral_code, r.commission_earned, r.referral_count, u.name, u.email
       ORDER BY r.commission_earned DESC
       LIMIT ?`,
      [parseInt(limit, 10) || 10]
    );

    return rows;
  } catch (error) {
    console.error('Error fetching top referrers:', error);
    return [];
  }
}

/**
 * Withdraw commission (payout)
 */
async function withdrawCommission(userId, amount) {
  try {
    const [rows] = await pool.query(
      `SELECT commission_earned FROM referrals WHERE referrer_id = ?`,
      [userId]
    );

    if (rows.length === 0 || rows[0].commission_earned < amount) {
      return { success: false, message: 'Insufficient commission balance' };
    }

    // Create payout record
    await pool.query(
      `INSERT INTO commission_payouts (referrer_id, amount, status, created_at)
       VALUES (?, ?, ?, NOW())`,
      [userId, amount, 'pending']
    );

    // Deduct from commission
    await pool.query(
      `UPDATE referrals SET commission_earned = commission_earned - ? WHERE referrer_id = ?`,
      [amount, userId]
    );

    return {
      success: true,
      message: 'Payout initiated. You will receive funds within 5-7 business days.',
    };
  } catch (error) {
    console.error('Error withdrawing commission:', error);
    throw error;
  }
}

module.exports = {
  generateReferralCode,
  applyReferralCode,
  trackReferralConversion,
  getReferralStats,
  getTopReferrers,
  withdrawCommission,
};
