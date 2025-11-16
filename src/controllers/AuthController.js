const AuthService = require('../services/AuthService');
const logger = require('../utils/logger');

class AuthController {
  async createGuestSession(req, res, next) {
    try {
      const result = await AuthService.createGuestSession();

      // Set token as HttpOnly cookie for security
      res.cookie('session_token', result.token, {
        httpOnly: true, // Prevents XSS attacks
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict', // CSRF protection
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });

      // Return player data without token (token is in cookie)
      res.status(201).json({
        status: 'success',
        data: {
          player: result.player,
          expiresAt: result.expiresAt
        }
      });

      logger.info(`Guest session created for player ${result.player.id}`);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      // Try to get token from cookie first, then fallback to Authorization header
      const token = req.cookies.session_token || req.headers.authorization?.substring(7);

      if (token) {
        await AuthService.revokeSession(token);
      }

      // Clear the HttpOnly cookie
      res.clearCookie('session_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
      });

      logger.info('User logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
