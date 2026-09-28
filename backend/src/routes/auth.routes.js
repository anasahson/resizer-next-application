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
router.get('/register', (req, res) => {
  res.json({
    endpoint: '/api/auth/register',
    method: 'POST',
    description: 'Register a new user account with email and password',
    contentType: 'application/json',
    body: {
      email: 'string (required)',
      password: 'string (min 6 characters, required)',
      name: 'string (optional)',
    },
  });
});
router.post('/register', handleRegister);

router.get('/login', (req, res) => {
  res.json({
    endpoint: '/api/auth/login',
    method: 'POST',
    description: 'Log in with existing credentials to receive a JWT bearer token',
    contentType: 'application/json',
    body: {
      email: 'string (required)',
      password: 'string (required)',
    },
  });
});
router.post('/login', handleLogin);

// Protected User Profile Endpoints
router.get('/me', authenticateToken, handleGetMe);
router.patch('/profile', authenticateToken, handleUpdateProfile);

// SuperAdmin RBAC Endpoints
router.get('/users', authenticateToken, requireRole('superadmin'), handleGetUsers);
router.patch('/users/:id/role', authenticateToken, requireRole('superadmin'), handleUpdateUserRole);

module.exports = router;
