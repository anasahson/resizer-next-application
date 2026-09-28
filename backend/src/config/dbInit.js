const { pool } = require('./db');
const bcrypt = require('bcryptjs');
/**
 * Initialize database tables and system settings.
 */
const initDb = async () => {
  try {
    const connection = await pool.getConnection();

    // 1. Initialize image_jobs table
    const createImageJobsTableQuery = `
      CREATE TABLE IF NOT EXISTS image_jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        target_format VARCHAR(30) NOT NULL,
        original_size BIGINT NOT NULL,
        output_size BIGINT NOT NULL,
        savings_percent FLOAT NOT NULL DEFAULT 0,
        width INT DEFAULT NULL,
        height INT DEFAULT NULL,
        processing_time_ms INT DEFAULT 0,
        status ENUM('completed', 'failed') DEFAULT 'completed',
        error_message TEXT DEFAULT NULL,
        user_id VARCHAR(191) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at),
        INDEX idx_status (status),
        INDEX idx_format (target_format),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createImageJobsTableQuery);

    // 2. Initialize User table
    const createUserTableQuery = `
      CREATE TABLE IF NOT EXISTS User (
        id VARCHAR(191) PRIMARY KEY,
        name VARCHAR(191),
        email VARCHAR(191) UNIQUE,
        emailVerified DATETIME(3) DEFAULT NULL,
        image VARCHAR(191) DEFAULT NULL,
        passwordHash VARCHAR(191) DEFAULT NULL,
        role ENUM('user', 'superadmin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createUserTableQuery);

    // 3. Initialize subscriptions table
    const createSubscriptionsTableQuery = `
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(191) NOT NULL UNIQUE,
        plan_id ENUM('free', 'pro', 'business') DEFAULT 'free',
        stripe_customer_id VARCHAR(255) DEFAULT NULL,
        stripe_subscription_id VARCHAR(255) DEFAULT NULL,
        status ENUM('active', 'past_due', 'unpaid', 'canceled', 'trialing') DEFAULT 'active',
        current_period_start DATETIME DEFAULT NULL,
        current_period_end DATETIME DEFAULT NULL,
        last_payment_date DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_plan (plan_id),
        INDEX idx_stripe_sub (stripe_subscription_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createSubscriptionsTableQuery);

    // 4. Initialize blog_posts table
    const createBlogPostsTableQuery = `
      CREATE TABLE IF NOT EXISTS blog_posts (
        id VARCHAR(191) PRIMARY KEY,
        slug VARCHAR(191) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        seo_title VARCHAR(255),
        meta_description TEXT,
        excerpt TEXT,
        category VARCHAR(60) DEFAULT 'Engineering',
        read_time VARCHAR(30) DEFAULT '5 min read',
        author_name VARCHAR(100) DEFAULT 'Resizer Engineering',
        author_role VARCHAR(100) DEFAULT 'Technical Staff',
        featured_image TEXT,
        tags TEXT,
        content LONGTEXT,
        faqs LONGTEXT,
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_category (category),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createBlogPostsTableQuery);

    // 5. Initialize system_settings table
    const createSettingsTableQuery = `
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createSettingsTableQuery);

    // 6. Initialize shareable_results table (viral growth cards)
    const createShareTableQuery = `
      CREATE TABLE IF NOT EXISTS shareable_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        share_id VARCHAR(64) UNIQUE NOT NULL,
        user_id VARCHAR(191) DEFAULT NULL,
        original_size BIGINT DEFAULT 0,
        output_size BIGINT DEFAULT 0,
        savings_percent DECIMAL(5,2) DEFAULT 0,
        format VARCHAR(30) DEFAULT 'webp',
        width INT DEFAULT 0,
        height INT DEFAULT 0,
        compression_time_ms INT DEFAULT 0,
        view_count INT DEFAULT 0,
        click_count INT DEFAULT 0,
        share_count INT DEFAULT 0,
        last_shared_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME DEFAULT NULL,
        INDEX idx_share_id (share_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createShareTableQuery);

    // Ensure columns exist if table was created previously without them
    try {
      await connection.query(`ALTER TABLE shareable_results ADD COLUMN click_count INT DEFAULT 0`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE shareable_results ADD COLUMN share_count INT DEFAULT 0`);
    } catch (_) {}
    try {
      await connection.query(`ALTER TABLE shareable_results ADD COLUMN last_shared_at DATETIME DEFAULT NULL`);
    } catch (_) {}

    // 7. Initialize referrals and referral_clicks tables
    const createReferralsTableQuery = `
      CREATE TABLE IF NOT EXISTS referrals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        referrer_id VARCHAR(191) NOT NULL UNIQUE,
        referral_code VARCHAR(64) NOT NULL UNIQUE,
        commission_earned DECIMAL(10,2) DEFAULT 0.00,
        referral_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_referrer (referrer_id),
        INDEX idx_code (referral_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createReferralsTableQuery);

    const createReferralClicksTableQuery = `
      CREATE TABLE IF NOT EXISTS referral_clicks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        referrer_id VARCHAR(191) NOT NULL,
        referred_user_id VARCHAR(191) DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'click',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ref_click (referrer_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createReferralClicksTableQuery);

    // 8. Initialize analytics_events table
    const createAnalyticsTableQuery = `
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(191) DEFAULT NULL,
        event_type VARCHAR(100) NOT NULL,
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_event_type (event_type),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await connection.query(createAnalyticsTableQuery);

    // Remove accounts created by the retired demo seed. Real accounts and roles remain unchanged.
    await connection.query(
      `DELETE FROM User
       WHERE id IN (?, ?)
          OR email IN (?, ?)`,
      ['usr_superadmin_001', 'usr_user_001', 'superadmin@resizer.com', 'user@resizer.com']
    );

    // Optional first-admin bootstrap. Existing accounts are never overwritten.
    if (process.env.SUPERADMIN_EMAIL && process.env.SUPERADMIN_PASSWORD) {
      const superAdminEmail = process.env.SUPERADMIN_EMAIL.toLowerCase().trim();
      const passwordHash = await bcrypt.hash(process.env.SUPERADMIN_PASSWORD, 10);
      await connection.query(
        `INSERT INTO User (id, name, email, passwordHash, role)
         SELECT ?, ?, ?, ?, 'superadmin'
         WHERE NOT EXISTS (SELECT 1 FROM User WHERE email = ?)`,
        ['usr_superadmin_bootstrap', 'Super Admin', superAdminEmail, passwordHash, superAdminEmail]
      );
    }

    // 9. Seed subscriptions for existing users
    const [allUsers] = await connection.query('SELECT id, email FROM User');
    for (const user of allUsers) {
      const [existing] = await connection.query('SELECT id FROM subscriptions WHERE user_id = ?', [user.id]);
      if (existing.length === 0) {
        await connection.query(
          `INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
           VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))`,
          [user.id, 'free', 'active']
        );
      }
    }

    // Seed default system settings if not exist
    const defaultSettings = [
      ['ai_active_provider', 'auto'],
      ['openai_model', 'gpt-4o-mini'],
      ['gemini_model', 'gemini-1.5-flash'],
      ['site_name', 'Resizer'],
      ['site_tagline', 'High-Performance Image Optimization & Codec Engine'],
      ['support_email', 'support@resizer.com'],
      ['default_quality', '80'],
      ['default_format', 'webp'],
      ['max_batch_size', '50'],
      ['allow_user_registration', 'true'],
      ['maintenance_mode', 'false'],
    ];
    for (const [k, v] of defaultSettings) {
      await connection.query(
        `INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (?, ?)`,
        [k, v]
      );
    }

    connection.release();
    console.log('✅ MySQL schema & data seeded successfully.');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize MySQL tables:', error.message);
    return false;
  }
};

module.exports = {
  initDb,
};
