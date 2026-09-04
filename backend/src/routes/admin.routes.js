const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// All admin routes strictly require valid SuperAdmin authentication
router.use(authenticateToken, requireRole('superadmin'));

// AI Settings & Connectivity
router.get('/settings/ai', adminController.handleGetAISettings);
router.post('/settings/ai', adminController.handleSaveAISettings);
router.post('/settings/ai/test', adminController.handleTestAIConnection);

// AI Generation Endpoints
router.post('/ai/generate-post', adminController.handleAIGeneratePost);
router.post('/ai/generate-image', adminController.handleAIGenerateImage);

// Blog Post Management
router.get('/posts', adminController.handleAdminGetPosts);
router.post('/posts', adminController.handleAdminCreatePost);
router.put('/posts/:id', adminController.handleAdminUpdatePost);
router.delete('/posts/:id', adminController.handleAdminDeletePost);

module.exports = router;
