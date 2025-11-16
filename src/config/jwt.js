const logger = require('../utils/logger');

// Validate JWT secret on startup
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  // In production, JWT_SECRET is mandatory
  if (process.env.NODE_ENV === 'production' && !secret) {
    const error = 'CRITICAL: JWT_SECRET must be defined in environment variables for production';
    logger.error(error);
    throw new Error(error);
  }

  // Development fallback with warning
  if (!secret) {
    logger.warn('WARNING: Using default JWT secret for development. DO NOT use in production!');
    return 'development-secret-key-change-this-in-production';
  }

  // Validate minimum secret length for security
  if (secret.length < 32) {
    const error = 'CRITICAL: JWT_SECRET must be at least 32 characters for security';
    logger.error(error);
    throw new Error(error);
  }

  logger.info('JWT configuration validated successfully');
  return secret;
};

module.exports = {
  secret: getJwtSecret(),
  expiresIn: process.env.JWT_EXPIRATION || '24h',
  issuer: 'tavern-game',
  audience: 'tavern-game-client'
};
