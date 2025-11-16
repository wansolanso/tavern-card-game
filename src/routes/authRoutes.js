const express = require('express');
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Create guest session
router.post('/guest', AuthController.createGuestSession);

// Logout (revoke session)
router.post('/logout', authenticate, AuthController.logout);

module.exports = router;
