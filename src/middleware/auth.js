const AuthService = require('../services/AuthService');
const { UnauthorizedError } = require('../utils/errors');
const { sendErrorResponse } = require('../utils/errorResponse');
const logger = require('../utils/logger');

async function authenticate(req, res, next) {
  try {
    // Try to get token from HttpOnly cookie first, then fallback to Authorization header
    let token = req.cookies?.session_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendErrorResponse(res, 'AUTH_MISSING_TOKEN');
      }
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }

    const session = await AuthService.validateToken(token);

    // Attach session to request
    req.user = session;
    req.playerId = session.playerId;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      // Map unauthorized errors to appropriate error codes
      if (error.message.includes('expired')) {
        return sendErrorResponse(res, 'AUTH_EXPIRED_SESSION');
      }
      if (error.message.includes('Invalid session')) {
        return sendErrorResponse(res, 'AUTH_SESSION_NOT_FOUND');
      }
      if (error.message.includes('Invalid token')) {
        return sendErrorResponse(res, 'AUTH_INVALID_JWT');
      }
      return sendErrorResponse(res, 'AUTH_INVALID_TOKEN');
    }

    logger.error('Authentication error:', error);
    return sendErrorResponse(res, 'SERVER_INTERNAL_ERROR');
  }
}

module.exports = { authenticate };
