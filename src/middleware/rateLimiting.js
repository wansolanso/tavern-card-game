const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const logger = require('../utils/logger');

// Global rate limiter - applied to all requests
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute globally
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode || 429).json({
      status: 'error',
      message: 'Too many requests, please try again later'
    });
  }
});

// Strict rate limiter for game creation
const gameCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 games per 15 minutes per user
  message: 'Too many games created, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit per user, not per IP (fallback to IPv6-safe IP key)
    return req.user?.id || ipKeyGenerator(req);
  },
  handler: (req, res, options) => {
    logger.warn(`Game creation rate limit exceeded for user: ${req.user?.id || req.ip}`);
    res.status(options.statusCode || 429).json({
      status: 'error',
      message: 'Too many games created, please wait before creating another game'
    });
  }
});

// Rate limiter for combat actions
const combatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 combat actions per minute
  message: 'Too many combat actions, slow down',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || ipKeyGenerator(req);
  },
  handler: (req, res, options) => {
    logger.warn(`Combat rate limit exceeded for user: ${req.user?.id || req.ip}`);
    res.status(options.statusCode || 429).json({
      status: 'error',
      message: 'Too many combat actions, please slow down'
    });
  }
});

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 auth attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode || 429).json({
      status: 'error',
      message: 'Too many authentication attempts, please try again later'
    });
  }
});

// Rate limiter for general game actions (equip, discard, upgrade)
const gameActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 actions per minute
  message: 'Too many actions, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || ipKeyGenerator(req);
  },
  handler: (req, res, options) => {
    logger.warn(`Game action rate limit exceeded for user: ${req.user?.id || req.ip}`);
    res.status(options.statusCode || 429).json({
      status: 'error',
      message: 'Too many actions, please slow down'
    });
  }
});

module.exports = {
  globalLimiter,
  gameCreationLimiter,
  combatLimiter,
  authLimiter,
  gameActionLimiter
};
