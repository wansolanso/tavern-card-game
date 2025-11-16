/**
 * Test Setup
 * Configures the test environment for all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only-not-for-production';
process.env.JWT_ISSUER = 'tavern-game-test';
process.env.JWT_AUDIENCE = 'tavern-game-test';
process.env.DATABASE_URL = ':memory:';

// Mock database to prevent actual DB connections during tests
jest.mock('../src/config/database', () => {
  const mockKnex = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
    then: jest.fn().mockResolvedValue([]),
    transaction: jest.fn(),
    raw: jest.fn(),
  };
  return mockKnex;
});

// Mock Redis to prevent connection attempts during tests
jest.mock('../src/config/redis', () => ({
  getRedisClient: jest.fn().mockResolvedValue(null),
}));

// Mock logger to reduce noise in test output
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock UUID to avoid ES module issues
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

// Global test utilities
global.testUtils = {
  /**
   * Create a mock player object
   */
  createMockPlayer: (overrides = {}) => ({
    id: 1,
    guest_id: 'guest_test-uuid',
    created_at: new Date(),
    ...overrides,
  }),

  /**
   * Create a mock game object
   */
  createMockGame: (overrides = {}) => ({
    id: 1,
    player_id: 1,
    phase: 'lobby',
    current_turn: 1,
    player_current_hp: 100,
    player_max_hp: 100,
    player_attack: 0,
    player_shield: 0,
    hp_slot_capacity: 3,
    shield_slot_capacity: 2,
    special_slot_capacity: 1,
    tavern: [],
    hand: [],
    equipped: { hp: [], shield: [], special: [] },
    ...overrides,
  }),

  /**
   * Create a mock card object
   */
  createMockCard: (overrides = {}) => ({
    id: 1,
    name: 'Test Card',
    type: 'character',
    rarity: 'common',
    hp: 10,
    shield: 5,
    abilities: { normal: [], special: [], passive: [] },
    ...overrides,
  }),

  /**
   * Wait for async operations to complete
   */
  wait: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
};
