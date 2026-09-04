const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters before starting the backend.');
}

/**
 * Generate a JWT token for a user payload
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Register a new user
 */
async function registerUser({ name, email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new Error('A valid email address is required.');
  }
  if (typeof password !== 'string' || password.length < 12) {
    throw new Error('Password must be at least 12 characters long.');
  }

  const [existing] = await pool.query('SELECT id FROM User WHERE email = ?', [normalizedEmail]);
  if (existing.length > 0) {
    throw new Error('An account with this email address already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = `usr_${crypto.randomBytes(8).toString('hex')}`;

  const query = `
    INSERT INTO User (id, name, email, passwordHash, role)
    VALUES (?, ?, ?, ?, ?)
  `;

  await pool.query(query, [id, name || 'User', normalizedEmail, passwordHash, 'user']);

  const newUser = {
    id,
    name: name || 'User',
    email: normalizedEmail,
    role: 'user',
  };

  const token = generateToken(newUser);

  return {
    user: newUser,
    token,
  };
}

/**
 * Log in an existing user
 */
async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new Error('A valid email address is required.');
  }

  const [rows] = await pool.query(
    'SELECT id, name, email, passwordHash, role, created_at FROM User WHERE email = ?',
    [normalizedEmail]
  );

  if (rows.length === 0) {
    throw new Error('Invalid email or password.');
  }

  const user = rows[0];

  if (!user.passwordHash) {
    throw new Error('This account was created with social login. Please set a password or use social sign-in.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  const userPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
  };

  const token = generateToken(userPayload);

  return {
    user: userPayload,
    token,
  };
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, image, created_at, updated_at FROM User WHERE id = ?',
    [userId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

/**
 * Update user's own profile (name, image, password)
 */
async function updateUserProfile(userId, { name, image, currentPassword, newPassword }) {
  const [rows] = await pool.query('SELECT id, passwordHash FROM User WHERE id = ?', [userId]);
  if (rows.length === 0) {
    throw new Error('User not found.');
  }

  const user = rows[0];
  let passwordHash = user.passwordHash;

  // If changing password, verify current password
  if (newPassword) {
    if (!currentPassword) {
      throw new Error('Current password is required to set a new password.');
    }
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new Error('Current password is incorrect.');
    }
    if (newPassword.length < 12) {
      throw new Error('New password must be at least 12 characters long.');
    }
    passwordHash = await bcrypt.hash(newPassword, 10);
  }

  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push('name = ?');
    params.push(name);
  }

  if (image !== undefined) {
    updates.push('image = ?');
    params.push(image);
  }

  if (newPassword) {
    updates.push('passwordHash = ?');
    params.push(passwordHash);
  }

  if (updates.length === 0) {
    return getUserById(userId);
  }

  params.push(userId);
  await pool.query(`UPDATE User SET ${updates.join(', ')} WHERE id = ?`, params);

  return getUserById(userId);
}

/**
 * List all users (SuperAdmin only)
 */
async function getAllUsers() {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, image, created_at FROM User ORDER BY created_at DESC'
  );
  return rows;
}

/**
 * Update user role (SuperAdmin only)
 */
async function updateUserRole(userId, newRole) {
  if (!['user', 'superadmin'].includes(newRole)) {
    throw new Error("Invalid role specified. Must be 'user' or 'superadmin'.");
  }

  const [result] = await pool.query('UPDATE User SET role = ? WHERE id = ?', [newRole, userId]);

  if (result.affectedRows === 0) {
    throw new Error('User not found.');
  }

  return {
    success: true,
    message: `User role successfully updated to '${newRole}'.`,
  };
}

module.exports = {
  generateToken,
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
};
