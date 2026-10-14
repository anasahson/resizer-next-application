const express = require('express');
const rateLimit = require('express-rate-limit');
const { optionalAuth } = require('../middleware/auth.middleware');
const contactController = require('../controllers/contact.controller');

const router = express.Router();

const contactSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages sent. Please try again later.' },
});

router.post('/', contactSubmissionLimiter, optionalAuth, contactController.handleSubmit);

module.exports = router;
