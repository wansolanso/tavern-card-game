const AuthService = require('../services/AuthService');
const { UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const session = await AuthService.validateToken(token);

    // Attach session to request
    req.user = session;
    req.playerId = session.playerId;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return res.status(401).json({
        status: 'error',
        message: error.message
      });
    }

    logger.error('Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

module.exports = { authenticate };
