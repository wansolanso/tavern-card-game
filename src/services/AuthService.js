const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const PlayerRepository = require('../repositories/PlayerRepository');
const { getRedisClient } = require('../config/redis');
const jwtConfig = require('../config/jwt');
const logger = require('../utils/logger');
const { UnauthorizedError } = require('../utils/errors');
const { GAME_CONFIG } = require('../constants/game');
const { requireNonEmptyString } = require('../utils/validation');

class AuthService {
  async createGuestSession() {
    try {
      const guestId = `guest_${uuidv4()}`;

      // Create player in database
      const player = await PlayerRepository.create(guestId);

      // Generate JWT token
      const token = jwt.sign(
        {
          playerId: player.id,
          guestId: player.guest_id,
          type: 'guest'
        },
        jwtConfig.secret,
        {
          expiresIn: jwtConfig.expiresIn,
          issuer: jwtConfig.issuer,
          audience: jwtConfig.audience
        }
      );

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Store session in database
      await PlayerRepository.createSession(player.id, token, expiresAt);

      // Cache session in Redis (if available)
      const redis = await getRedisClient();
      if (redis) {
        await redis.setEx(
          `session:${token}`,
          GAME_CONFIG.SESSION_CACHE_TTL,
          JSON.stringify({
            playerId: player.id,
            guestId: player.guest_id,
            expiresAt: expiresAt.toISOString()
          })
        );
      }

      logger.info(`Guest session created for player ${player.id}`);

      return {
        token,
        player: {
          id: player.id,
          guestId: player.guest_id
        },
        expiresAt: expiresAt.toISOString()
      };
    } catch (error) {
      logger.error('Error creating guest session:', error);
      throw error;
    }
  }

  async validateToken(token) {
    try {
      // Validate input
      requireNonEmptyString(token, 'token');

      // Check Redis cache first (if available)
      const redis = await getRedisClient();
      if (redis) {
        const cachedSession = await redis.get(`session:${token}`);

        if (cachedSession) {
          const session = JSON.parse(cachedSession);

          // Verify expiration
          if (new Date(session.expiresAt) < new Date()) {
            await this.revokeSession(token);
            const error = new UnauthorizedError('Session expired');
            error.code = 'AUTH_003'; // AUTH_EXPIRED_SESSION
            throw error;
          }

          return {
            playerId: session.playerId,
            guestId: session.guestId
          };
        }
      }

      // If not in cache, check database
      const session = await PlayerRepository.findSessionByToken(token);

      if (!session) {
        const error = new UnauthorizedError('Invalid session');
        error.code = 'AUTH_004'; // AUTH_SESSION_NOT_FOUND
        throw error;
      }

      if (new Date(session.expires_at) < new Date()) {
        await this.revokeSession(token);
        const error = new UnauthorizedError('Session expired');
        error.code = 'AUTH_003'; // AUTH_EXPIRED_SESSION
        throw error;
      }

      // Verify JWT signature
      const decoded = jwt.verify(token, jwtConfig.secret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      });

      // Restore to Redis cache (if available)
      if (redis) {
        await redis.setEx(
          `session:${token}`,
          GAME_CONFIG.SESSION_CACHE_TTL,
          JSON.stringify({
            playerId: session.player_id,
            guestId: session.guest_id,
            expiresAt: session.expires_at.toISOString()
          })
        );
      }

      return {
        playerId: session.player_id,
        guestId: session.guest_id
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        const jwtError = new UnauthorizedError('Invalid token');
        jwtError.code = 'AUTH_005'; // AUTH_INVALID_JWT
        throw jwtError;
      }
      if (error instanceof jwt.TokenExpiredError) {
        const expError = new UnauthorizedError('Token expired');
        expError.code = 'AUTH_003'; // AUTH_EXPIRED_SESSION
        throw expError;
      }
      throw error;
    }
  }

  async revokeSession(token) {
    try {
      // Validate input
      requireNonEmptyString(token, 'token');

      // Remove from Redis (if available)
      const redis = await getRedisClient();
      if (redis) {
        await redis.del(`session:${token}`);
      }

      // Remove from database
      await PlayerRepository.deleteSession(token);

      logger.info('Session revoked');
    } catch (error) {
      logger.error('Error revoking session:', error);
      throw error;
    }
  }

  async cleanExpiredSessions() {
    try {
      const deleted = await PlayerRepository.cleanExpiredSessions();
      logger.info(`Cleaned ${deleted} expired sessions`);
      return deleted;
    } catch (error) {
      logger.error('Error cleaning expired sessions:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
