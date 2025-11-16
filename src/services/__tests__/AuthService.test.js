const AuthService = require('../AuthService');
const PlayerRepository = require('../../repositories/PlayerRepository');
const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../../utils/errors');

jest.mock('../../repositories/PlayerRepository');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGuestSession', () => {
    it('should create guest player and return JWT token', async () => {
      const mockPlayer = {
        id: 123,
        guest_id: 'guest_test-uuid',
        created_at: new Date(),
      };

      const mockToken = 'mock-jwt-token';
      const mockExpiresAt = new Date();
      mockExpiresAt.setHours(mockExpiresAt.getHours() + 24);

      PlayerRepository.create.mockResolvedValue(mockPlayer);
      jwt.sign.mockReturnValue(mockToken);
      PlayerRepository.createSession.mockResolvedValue();

      const result = await AuthService.createGuestSession();

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('player');
      expect(result.token).toBe(mockToken);
      expect(result.player.id).toBe(mockPlayer.id);
      expect(result.player.guestId).toBe(mockPlayer.guest_id);
      expect(PlayerRepository.create).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(PlayerRepository.createSession).toHaveBeenCalledWith(
        mockPlayer.id,
        mockToken,
        expect.any(Date)
      );
    });

    it('should throw error if player creation fails', async () => {
      const error = new Error('Database connection failed');
      PlayerRepository.create.mockRejectedValue(error);

      await expect(AuthService.createGuestSession()).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should include correct JWT payload', async () => {
      const mockPlayer = {
        id: 456,
        guest_id: 'guest_another-uuid',
        created_at: new Date(),
      };

      PlayerRepository.create.mockResolvedValue(mockPlayer);
      jwt.sign.mockReturnValue('token');
      PlayerRepository.createSession.mockResolvedValue();

      await AuthService.createGuestSession();

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: mockPlayer.id,
          guestId: mockPlayer.guest_id,
          type: 'guest',
        }),
        expect.any(String),
        expect.objectContaining({
          expiresIn: expect.any(String),
          issuer: expect.any(String),
          audience: expect.any(String),
        })
      );
    });
  });

  describe('validateToken', () => {
    it('should validate token from database when not in cache', async () => {
      const mockToken = 'valid-token';
      const mockSession = {
        player_id: 123,
        guest_id: 'guest_test-uuid',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // Future date
      };

      PlayerRepository.findSessionByToken.mockResolvedValue(mockSession);
      jwt.verify.mockReturnValue({
        playerId: mockSession.player_id,
        guestId: mockSession.guest_id,
      });

      const result = await AuthService.validateToken(mockToken);

      expect(result).toEqual({
        playerId: mockSession.player_id,
        guestId: mockSession.guest_id,
      });
      expect(PlayerRepository.findSessionByToken).toHaveBeenCalledWith(mockToken);
      expect(jwt.verify).toHaveBeenCalledWith(
        mockToken,
        expect.any(String),
        expect.objectContaining({
          issuer: expect.any(String),
          audience: expect.any(String),
        })
      );
    });

    it('should throw UnauthorizedError if session not found', async () => {
      const mockToken = 'invalid-token';
      PlayerRepository.findSessionByToken.mockResolvedValue(null);

      await expect(AuthService.validateToken(mockToken)).rejects.toThrow(
        UnauthorizedError
      );
      await expect(AuthService.validateToken(mockToken)).rejects.toThrow(
        'Invalid session'
      );
    });

    it('should throw UnauthorizedError if session expired', async () => {
      const mockToken = 'expired-token';
      const mockSession = {
        player_id: 123,
        guest_id: 'guest_test-uuid',
        expires_at: new Date(Date.now() - 1000), // Past date
      };

      PlayerRepository.findSessionByToken.mockResolvedValue(mockSession);
      PlayerRepository.deleteSession.mockResolvedValue();

      await expect(AuthService.validateToken(mockToken)).rejects.toThrow(
        UnauthorizedError
      );
      await expect(AuthService.validateToken(mockToken)).rejects.toThrow(
        'Session expired'
      );
      expect(PlayerRepository.deleteSession).toHaveBeenCalledWith(mockToken);
    });

    it('should throw ValidationError if token is empty', async () => {
      await expect(AuthService.validateToken('')).rejects.toThrow();
      await expect(AuthService.validateToken(null)).rejects.toThrow();
      await expect(AuthService.validateToken(undefined)).rejects.toThrow();
    });

    it('should throw UnauthorizedError if JWT verification fails', async () => {
      const mockToken = 'malformed-token';
      const mockSession = {
        player_id: 123,
        guest_id: 'guest_test-uuid',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      PlayerRepository.findSessionByToken.mockResolvedValue(mockSession);
      jwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid signature');
      });

      await expect(AuthService.validateToken(mockToken)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe('revokeSession', () => {
    it('should delete session from database', async () => {
      const mockToken = 'token-to-revoke';
      PlayerRepository.deleteSession.mockResolvedValue();

      await AuthService.revokeSession(mockToken);

      expect(PlayerRepository.deleteSession).toHaveBeenCalledWith(mockToken);
    });

    it('should throw ValidationError if token is empty', async () => {
      await expect(AuthService.revokeSession('')).rejects.toThrow();
      await expect(AuthService.revokeSession(null)).rejects.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      const mockToken = 'token-to-revoke';
      const error = new Error('Database error');
      PlayerRepository.deleteSession.mockRejectedValue(error);

      await expect(AuthService.revokeSession(mockToken)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('cleanExpiredSessions', () => {
    it('should clean expired sessions and return count', async () => {
      PlayerRepository.cleanExpiredSessions.mockResolvedValue(5);

      const result = await AuthService.cleanExpiredSessions();

      expect(result).toBe(5);
      expect(PlayerRepository.cleanExpiredSessions).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during cleanup', async () => {
      const error = new Error('Cleanup failed');
      PlayerRepository.cleanExpiredSessions.mockRejectedValue(error);

      await expect(AuthService.cleanExpiredSessions()).rejects.toThrow(
        'Cleanup failed'
      );
    });
  });
});
