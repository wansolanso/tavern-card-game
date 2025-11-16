const express = require('express');
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// Create guest session (rate limited to prevent abuse)
router.post('/guest', authLimiter, AuthController.createGuestSession);

// Logout (revoke session)
router.post('/logout', authenticate, AuthController.logout);

module.exports = router;
