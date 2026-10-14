const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const posthogAdminController = require('../controllers/posthogAdmin.controller');
const contactController = require('../controllers/contact.controller');
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
router.get('/contact', contactController.handleAdminList);

// PostHog Analytics (reads data back from PostHog via personal API key)
router.get('/posthog/status', posthogAdminController.handleStatus);
router.get('/posthog/overview', posthogAdminController.handleOverview);
router.get('/posthog/events', posthogAdminController.handleEvents);
router.get('/posthog/errors', posthogAdminController.handleErrors);
router.get('/posthog/ai', posthogAdminController.handleAiUsage);
router.get('/posthog/flags', posthogAdminController.handleFlags);
router.post('/posthog/flags/:id/:action', posthogAdminController.handleSetFlag);
router.get('/posthog/pages', posthogAdminController.handlePages);
router.get('/posthog/sections', posthogAdminController.handleSections);
router.get('/posthog/inputs', posthogAdminController.handleInputs);

// Image hosting audit trail (superadmin only)
router.get('/hosting/logs', posthogAdminController.handleListHostingLogs);
router.get('/hosting/logs.csv', posthogAdminController.handleDownloadHostingLogsCsv);

module.exports = router;
