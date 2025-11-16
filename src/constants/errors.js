/**
 * Standardized Error Messages and Codes
 *
 * All error messages follow this format:
 * {
 *   code: 'CATEGORY_NNN',
 *   message: 'Brief user-friendly description',
 *   action: 'Actionable guidance for the user',
 *   statusCode: HTTP status code
 * }
 */

const ErrorMessages = {
  // ============================================
  // Authentication Errors (AUTH_xxx)
  // ============================================

  AUTH_MISSING_TOKEN: {
    code: 'AUTH_001',
    message: 'Authentication required',
    action: 'Please provide a valid session token in cookies or Authorization header',
    statusCode: 401
  },

  AUTH_INVALID_TOKEN: {
    code: 'AUTH_002',
    message: 'Invalid session token',
    action: 'Your session is invalid. Please create a new guest session',
    statusCode: 401
  },

  AUTH_EXPIRED_SESSION: {
    code: 'AUTH_003',
    message: 'Session has expired',
    action: 'Your session expired after 24 hours. Please create a new guest session',
    statusCode: 401
  },

  AUTH_SESSION_NOT_FOUND: {
    code: 'AUTH_004',
    message: 'Session not found',
    action: 'Your session could not be found. Please create a new guest session',
    statusCode: 401
  },

  AUTH_INVALID_JWT: {
    code: 'AUTH_005',
    message: 'Invalid authentication token format',
    action: 'The token format is invalid. Please create a new guest session',
    statusCode: 401
  },

  // ============================================
  // Game Errors (GAME_xxx)
  // ============================================

  GAME_NOT_FOUND: {
    code: 'GAME_001',
    message: 'Game not found',
    action: 'The game does not exist or has been deleted. Please create a new game',
    statusCode: 404
  },

  GAME_INVALID_PHASE: {
    code: 'GAME_002',
    message: 'Invalid game phase for this action',
    action: 'This action cannot be performed in the current game phase',
    statusCode: 400
  },

  GAME_PLAYER_DEFEATED: {
    code: 'GAME_003',
    message: 'Player has been defeated',
    action: 'Your HP reached zero. Please start a new game',
    statusCode: 400
  },

  GAME_CREATION_FAILED: {
    code: 'GAME_004',
    message: 'Failed to create game',
    action: 'An error occurred while creating the game. Please try again',
    statusCode: 500
  },

  GAME_STATE_LOAD_FAILED: {
    code: 'GAME_005',
    message: 'Failed to load game state',
    action: 'Could not retrieve game data. Please refresh or start a new game',
    statusCode: 500
  },

  // ============================================
  // Card Errors (CARD_xxx)
  // ============================================

  CARD_NOT_FOUND: {
    code: 'CARD_001',
    message: 'Card not found',
    action: 'The requested card does not exist or has been removed',
    statusCode: 404
  },

  CARD_INVALID_SLOT: {
    code: 'CARD_002',
    message: 'Invalid equipment slot type',
    action: 'Please select a valid slot: hp, shield, special, passive, or normal',
    statusCode: 400
  },

  CARD_SLOT_FULL: {
    code: 'CARD_003',
    message: 'Equipment slot is full',
    action: 'Unequip a card from this slot or upgrade the slot capacity',
    statusCode: 409
  },

  CARD_NOT_IN_HAND: {
    code: 'CARD_004',
    message: 'Card is not in your hand',
    action: 'You can only equip cards from your hand',
    statusCode: 400
  },

  CARD_NOT_EQUIPPED: {
    code: 'CARD_005',
    message: 'Card is not equipped',
    action: 'The card must be equipped before you can unequip it',
    statusCode: 400
  },

  CARD_RANDOM_GENERATION_FAILED: {
    code: 'CARD_006',
    message: 'Failed to generate random cards',
    action: 'Not enough cards available. Please try again later',
    statusCode: 500
  },

  // ============================================
  // Combat Errors (COMBAT_xxx)
  // ============================================

  COMBAT_INVALID_TARGET: {
    code: 'COMBAT_001',
    message: 'Invalid combat target',
    action: 'Please select a valid enemy card from the tavern',
    statusCode: 400
  },

  COMBAT_TARGET_NOT_IN_TAVERN: {
    code: 'COMBAT_002',
    message: 'Target card not found in tavern',
    action: 'The target card is no longer in the tavern. Please select another target',
    statusCode: 400
  },

  COMBAT_NO_ATTACK_POWER: {
    code: 'COMBAT_003',
    message: 'No attack power available',
    action: 'Equip cards in your HP slot to gain attack power before attacking',
    statusCode: 400
  },

  COMBAT_PROCESSING: {
    code: 'COMBAT_004',
    message: 'Combat already in progress',
    action: 'Wait for the current combat to finish before attacking again',
    statusCode: 409
  },

  COMBAT_FAILED: {
    code: 'COMBAT_005',
    message: 'Combat action failed',
    action: 'An error occurred during combat. Please try again',
    statusCode: 500
  },

  // ============================================
  // Validation Errors (VALIDATION_xxx)
  // ============================================

  VALIDATION_INVALID_INPUT: {
    code: 'VALIDATION_001',
    message: 'Invalid input provided',
    action: 'Please check your input and try again',
    statusCode: 400
  },

  VALIDATION_MISSING_REQUIRED_FIELD: {
    code: 'VALIDATION_002',
    message: 'Required field is missing',
    action: 'Please provide all required fields',
    statusCode: 400
  },

  VALIDATION_INVALID_TYPE: {
    code: 'VALIDATION_003',
    message: 'Invalid data type',
    action: 'The provided data type does not match the expected format',
    statusCode: 400
  },

  VALIDATION_INVALID_ID: {
    code: 'VALIDATION_004',
    message: 'Invalid ID format',
    action: 'IDs must be positive integers',
    statusCode: 400
  },

  VALIDATION_INVALID_ARRAY: {
    code: 'VALIDATION_005',
    message: 'Expected array but received different type',
    action: 'The parameter must be an array',
    statusCode: 400
  },

  VALIDATION_INVALID_STRING: {
    code: 'VALIDATION_006',
    message: 'Invalid string value',
    action: 'The parameter must be a non-empty string',
    statusCode: 400
  },

  VALIDATION_OUT_OF_RANGE: {
    code: 'VALIDATION_007',
    message: 'Value is out of valid range',
    action: 'Please provide a value within the acceptable range',
    statusCode: 400
  },

  // ============================================
  // Rate Limiting Errors (RATE_xxx)
  // ============================================

  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_001',
    message: 'Too many requests',
    action: 'You have exceeded the rate limit. Please wait a moment before trying again',
    statusCode: 429
  },

  RATE_LIMIT_GAME_CREATION: {
    code: 'RATE_002',
    message: 'Too many game creation requests',
    action: 'Please wait before creating another game',
    statusCode: 429
  },

  RATE_LIMIT_SESSION_CREATION: {
    code: 'RATE_003',
    message: 'Too many session creation requests',
    action: 'Please wait before creating another session',
    statusCode: 429
  },

  // ============================================
  // Database Errors (DB_xxx)
  // ============================================

  DB_CONNECTION_FAILED: {
    code: 'DB_001',
    message: 'Database connection failed',
    action: 'Unable to connect to database. Please try again later',
    statusCode: 503
  },

  DB_QUERY_FAILED: {
    code: 'DB_002',
    message: 'Database query failed',
    action: 'An error occurred while accessing the database. Please try again',
    statusCode: 500
  },

  DB_TRANSACTION_FAILED: {
    code: 'DB_003',
    message: 'Database transaction failed',
    action: 'The operation could not be completed. Please try again',
    statusCode: 500
  },

  DB_CONSTRAINT_VIOLATION: {
    code: 'DB_004',
    message: 'Database constraint violated',
    action: 'The operation violates data integrity rules. Please check your input',
    statusCode: 409
  },

  // ============================================
  // Cache Errors (CACHE_xxx)
  // ============================================

  CACHE_UNAVAILABLE: {
    code: 'CACHE_001',
    message: 'Cache service unavailable',
    action: 'Redis cache is temporarily unavailable. The application will continue without caching',
    statusCode: 503
  },

  CACHE_READ_FAILED: {
    code: 'CACHE_002',
    message: 'Failed to read from cache',
    action: 'Cache read failed. Data will be fetched from database',
    statusCode: 500
  },

  CACHE_WRITE_FAILED: {
    code: 'CACHE_003',
    message: 'Failed to write to cache',
    action: 'Cache write failed. The operation will continue without caching',
    statusCode: 500
  },

  // ============================================
  // Server Errors (SERVER_xxx)
  // ============================================

  SERVER_INTERNAL_ERROR: {
    code: 'SERVER_001',
    message: 'Internal server error',
    action: 'An unexpected error occurred. Please try again or contact support',
    statusCode: 500
  },

  SERVER_SERVICE_UNAVAILABLE: {
    code: 'SERVER_002',
    message: 'Service temporarily unavailable',
    action: 'The service is temporarily down. Please try again later',
    statusCode: 503
  },

  SERVER_TIMEOUT: {
    code: 'SERVER_003',
    message: 'Request timeout',
    action: 'The request took too long to process. Please try again',
    statusCode: 504
  },

  // ============================================
  // Resource Errors (RESOURCE_xxx)
  // ============================================

  RESOURCE_NOT_FOUND: {
    code: 'RESOURCE_001',
    message: 'Resource not found',
    action: 'The requested resource does not exist',
    statusCode: 404
  },

  RESOURCE_ALREADY_EXISTS: {
    code: 'RESOURCE_002',
    message: 'Resource already exists',
    action: 'A resource with this identifier already exists',
    statusCode: 409
  },

  RESOURCE_CONFLICT: {
    code: 'RESOURCE_003',
    message: 'Resource conflict',
    action: 'The operation conflicts with the current state of the resource',
    statusCode: 409
  }
};

module.exports = { ErrorMessages };
