/**
 * SECURITY TESTS: GameRepository.update() Mass Assignment Protection
 *
 * These tests validate that the update() method correctly prevents
 * Mass Assignment attacks (CWE-915) by rejecting unauthorized fields.
 */

const GameRepository = require('../GameRepository');

// Mock logger to prevent console spam
jest.mock('../../utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

// Mock the entire database module
jest.mock('../../config/database', () => {
  const mockChain = {
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockResolvedValue(1),
    first: jest.fn().mockResolvedValue({
      id: 1,
      player_id: 'player-123',
      phase: 'tavern',
      current_turn: 1,
      player_current_hp: 100,
      player_max_hp: 100
    }),
    join: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    whereNotIn: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue([]),
    orderByRaw: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis()
  };

  const mockDb = jest.fn(() => mockChain);
  mockDb.mockChain = mockChain; // Export for direct access
  return mockDb;
});

describe('GameRepository.update() - Mass Assignment Protection', () => {
  const db = require('../../config/database');
  let repository;
  let mockDbChain;

  beforeEach(() => {
    repository = GameRepository; // Singleton instance
    mockDbChain = db.mockChain;
    jest.clearAllMocks();

    // Reset all mock implementations
    mockDbChain.where.mockReturnThis();
    mockDbChain.update.mockResolvedValue(1);
    mockDbChain.first.mockResolvedValue({
      id: 1,
      player_id: 'player-123',
      phase: 'tavern',
      current_turn: 1,
      player_current_hp: 100,
      player_max_hp: 100
    });
    mockDbChain.join.mockReturnThis();
    mockDbChain.whereIn.mockReturnThis();
    mockDbChain.select.mockResolvedValue([]);
  });

  describe('✅ ALLOWED FIELDS', () => {
    it('should allow updating phase field', async () => {
      await repository.update(1, { phase: 'combat' });

      expect(mockDbChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'combat'
        })
      );
    });

    it('should allow updating current_turn field', async () => {
      await repository.update(1, { current_turn: 5 });

      expect(mockDbChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          current_turn: 5
        })
      );
    });

    it('should allow updating player_current_hp field', async () => {
      await repository.update(1, { player_current_hp: 75 });

      expect(mockDbChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          player_current_hp: 75
        })
      );
    });

    it('should allow updating player_max_hp field', async () => {
      await repository.update(1, { player_max_hp: 120 });

      expect(mockDbChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          player_max_hp: 120
        })
      );
    });

    it('should allow updating multiple allowed fields at once', async () => {
      await repository.update(1, {
        phase: 'combat',
        current_turn: 3,
        player_current_hp: 80,
        player_max_hp: 100
      });

      expect(mockDbChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'combat',
          current_turn: 3,
          player_current_hp: 80,
          player_max_hp: 100
        })
      );
    });
  });

  describe('❌ MASS ASSIGNMENT ATTACK PREVENTION', () => {
    it('should REJECT unauthorized field: player_id', async () => {
      const logger = require('../../utils/logger');

      await repository.update(1, {
        phase: 'combat',
        player_id: 'attacker-malicious-id' // ❌ ATTACK ATTEMPT
      });

      // player_id should NOT be in the update
      expect(mockDbChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'combat'
        })
      );

      expect(mockDbChain.update).toHaveBeenCalledWith(
        expect.not.objectContaining({
          player_id: expect.anything()
        })
      );

      // Should log the attack attempt
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Rejected unauthorized update fields'),
        expect.arrayContaining(['player_id'])
      );
    });

    it('should REJECT prototype pollution attack: __proto__', async () => {
      const logger = require('../../utils/logger');

      await repository.update(1, {
        phase: 'combat',
        __proto__: { isAdmin: true } // ❌ PROTOTYPE POLLUTION ATTACK
      });

      expect(mockDbChain.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          __proto__: expect.anything()
        })
      );

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should REJECT created_at field manipulation', async () => {
      const logger = require('../../utils/logger');
      const fakeDate = new Date('2020-01-01');

      await repository.update(1, {
        phase: 'combat',
        created_at: fakeDate // ❌ ATTACK: Tampering with creation date
      });

      expect(mockDbChain.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          created_at: fakeDate
        })
      );

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should REJECT multiple malicious fields at once', async () => {
      const logger = require('../../utils/logger');

      await repository.update(1, {
        phase: 'combat',           // ✅ ALLOWED
        player_id: 'hacker-123',  // ❌ FORBIDDEN
        is_admin: true,           // ❌ FORBIDDEN
        gold: 999999,             // ❌ FORBIDDEN (doesn't exist)
        __proto__: { hack: true } // ❌ FORBIDDEN
      });

      // Only phase should be updated
      expect(mockDbChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'combat'
        })
      );

      // All malicious fields rejected
      expect(mockDbChain.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          player_id: expect.anything(),
          is_admin: expect.anything(),
          gold: expect.anything(),
          __proto__: expect.anything()
        })
      );

      // Should log all rejected fields
      expect(logger.warn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['player_id', 'is_admin', 'gold', '__proto__'])
      );
    });
  });

  describe('🛡️ TYPE VALIDATION', () => {
    it('should REJECT negative HP values', async () => {
      await expect(
        repository.update(1, { player_current_hp: -50 })
      ).rejects.toThrow('must be a non-negative integer');
    });

    it('should REJECT invalid phase values', async () => {
      await expect(
        repository.update(1, { phase: 'hacked_phase' })
      ).rejects.toThrow('Invalid phase');
    });

    it('should REJECT non-integer HP values', async () => {
      await expect(
        repository.update(1, { player_current_hp: 'not-a-number' })
      ).rejects.toThrow('must be a non-negative integer');
    });

    it('should REJECT invalid turn numbers', async () => {
      await expect(
        repository.update(1, { current_turn: 0 })
      ).rejects.toThrow('must be a positive integer');

      await expect(
        repository.update(1, { current_turn: -5 })
      ).rejects.toThrow('must be a positive integer');
    });

    it('should accept valid phase values', async () => {
      const validPhases = ['tavern', 'combat', 'victory', 'defeat'];

      for (const phase of validPhases) {
        await expect(
          repository.update(1, { phase })
        ).resolves.not.toThrow();
      }
    });
  });

  describe('⚡ EDGE CASES', () => {
    it('should handle empty updates object gracefully', async () => {
      const result = await repository.update(1, {});

      // Should not call update if no valid fields
      expect(mockDbChain.update).not.toHaveBeenCalled();

      // Should still return the game (via findById)
      expect(result).toHaveProperty('id', 1);
    });

    it('should handle updates with ONLY invalid fields', async () => {
      const logger = require('../../utils/logger');

      await repository.update(1, {
        player_id: 'hacker',
        invalid_field: 'value'
      });

      // Should not update anything
      expect(mockDbChain.update).not.toHaveBeenCalled();

      // Should log the rejection
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should always set updated_at when updating', async () => {
      await repository.update(1, { phase: 'combat' });

      expect(mockDbChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(Date)
        })
      );
    });
  });

  describe('📋 WHITELIST CONFIGURATION', () => {
    it('should have correct allowed fields defined', () => {
      // Access via constructor since GameRepository is exported as instance
      const allowedFields = repository.constructor.ALLOWED_UPDATE_FIELDS;

      expect(allowedFields.has('phase')).toBe(true);
      expect(allowedFields.has('current_turn')).toBe(true);
      expect(allowedFields.has('player_current_hp')).toBe(true);
      expect(allowedFields.has('player_max_hp')).toBe(true);

      // Ensure forbidden fields are NOT in whitelist
      expect(allowedFields.has('player_id')).toBe(false);
      expect(allowedFields.has('created_at')).toBe(false);
      expect(allowedFields.has('__proto__')).toBe(false);
    });
  });
});
