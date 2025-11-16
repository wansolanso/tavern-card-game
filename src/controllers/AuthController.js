const AuthService = require('../services/AuthService');
const logger = require('../utils/logger');

class AuthController {
  async createGuestSession(req, res, next) {
    try {
      const result = await AuthService.createGuestSession();

      res.status(201).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const token = req.headers.authorization?.substring(7);

      if (token) {
        await AuthService.revokeSession(token);
      }

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
