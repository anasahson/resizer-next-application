const express = require('express');
const router = express.Router();
const {
  handleRegister,
  handleLogin,
  handleGetMe,
  handleUpdateProfile,
  handleGetUsers,
  handleUpdateUserRole,
} = require('../controllers/auth.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// Public Authentication Endpoints
router.post('/register', handleRegister);
router.post('/login', handleLogin);

// Protected User Profile Endpoints
router.get('/me', authenticateToken, handleGetMe);
router.patch('/profile', authenticateToken, handleUpdateProfile);

// SuperAdmin RBAC Endpoints
router.get('/users', authenticateToken, requireRole('superadmin'), handleGetUsers);
router.patch('/users/:id/role', authenticateToken, requireRole('superadmin'), handleUpdateUserRole);

module.exports = router;
