/**
 * Frontend Error Constants
 *
 * Standardized error messages for client-side errors
 * Backend error codes are also defined here for type safety
 */

export interface ErrorDefinition {
  code: string;
  message: string;
  action: string;
}

/**
 * Frontend-specific errors
 */
export const FrontendErrors = {
  // Network errors
  NETWORK_OFFLINE: {
    code: 'NETWORK_001',
    message: 'No internet connection',
    action: 'Please check your network connection and try again'
  },
  NETWORK_TIMEOUT: {
    code: 'NETWORK_002',
    message: 'Request timed out',
    action: 'The server is taking too long to respond. Please try again'
  },
  NETWORK_ERROR: {
    code: 'NETWORK_003',
    message: 'Network request failed',
    action: 'Unable to reach the server. Please check your connection'
  },

  // WebSocket errors
  WEBSOCKET_DISCONNECTED: {
    code: 'WEBSOCKET_001',
    message: 'Connection lost',
    action: 'Attempting to reconnect...'
  },
  WEBSOCKET_FAILED: {
    code: 'WEBSOCKET_002',
    message: 'Unable to connect to game server',
    action: 'Please refresh the page or try again later'
  },
  WEBSOCKET_RECONNECTING: {
    code: 'WEBSOCKET_003',
    message: 'Reconnecting to server',
    action: 'Please wait while we restore your connection'
  },
  WEBSOCKET_MAX_RETRIES: {
    code: 'WEBSOCKET_004',
    message: 'Connection failed after multiple attempts',
    action: 'Please refresh the page to reconnect'
  },

  // UI errors
  UI_INVALID_INPUT: {
    code: 'UI_001',
    message: 'Invalid input',
    action: 'Please check your input and try again'
  },
  UI_COMPONENT_ERROR: {
    code: 'UI_002',
    message: 'Component error',
    action: 'An error occurred. Please refresh the page'
  },
  UI_RENDER_ERROR: {
    code: 'UI_003',
    message: 'Failed to render component',
    action: 'Please refresh the page. If the issue persists, clear your browser cache'
  },
  UI_INVALID_STATE: {
    code: 'UI_004',
    message: 'Invalid UI state',
    action: 'The interface is in an unexpected state. Please refresh the page'
  },

  // State management errors
  STATE_SYNC_FAILED: {
    code: 'STATE_001',
    message: 'Failed to sync game state',
    action: 'Please refresh the page to reload the latest game state'
  },
  STATE_CORRUPTED: {
    code: 'STATE_002',
    message: 'Game state corrupted',
    action: 'Local game state is corrupted. Please refresh to reload from server'
  },
  STATE_INVALID_ACTION: {
    code: 'STATE_003',
    message: 'Invalid action for current state',
    action: 'This action cannot be performed right now'
  },

  // Card/Game specific errors
  CARD_INVALID_TARGET: {
    code: 'CARD_FRONTEND_001',
    message: 'Invalid card target',
    action: 'Please select a valid target card'
  },
  CARD_ACTION_BLOCKED: {
    code: 'CARD_FRONTEND_002',
    message: 'Card action blocked',
    action: 'This action is not available right now'
  },

  // Loading/Processing errors
  LOADING_TIMEOUT: {
    code: 'LOADING_001',
    message: 'Loading timed out',
    action: 'The operation took too long. Please try again'
  },
  LOADING_FAILED: {
    code: 'LOADING_002',
    message: 'Failed to load data',
    action: 'Unable to load required data. Please refresh the page'
  },

  // Unknown error fallback
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_001',
    message: 'An unexpected error occurred',
    action: 'Please try again. If the problem persists, refresh the page'
  }
} as const;

/**
 * Backend error codes (for type safety and mapping)
 * These match the backend error codes defined in src/constants/errors.js
 */
export const BackendErrors = {
  // Authentication
  AUTH_MISSING_TOKEN: 'AUTH_001',
  AUTH_INVALID_TOKEN: 'AUTH_002',
  AUTH_EXPIRED_SESSION: 'AUTH_003',
  AUTH_SESSION_NOT_FOUND: 'AUTH_004',

  // Game
  GAME_NOT_FOUND: 'GAME_001',
  GAME_INVALID_PHASE: 'GAME_002',
  GAME_PLAYER_DEFEATED: 'GAME_003',

  // Card
  CARD_NOT_FOUND: 'CARD_001',
  CARD_INVALID_SLOT: 'CARD_002',
  CARD_SLOT_FULL: 'CARD_003',
  CARD_NOT_IN_HAND: 'CARD_004',

  // Combat
  COMBAT_INVALID_TARGET: 'COMBAT_001',
  COMBAT_TARGET_NOT_IN_TAVERN: 'COMBAT_002',
  COMBAT_NO_ATTACK_POWER: 'COMBAT_003',
  COMBAT_PROCESSING: 'COMBAT_004',

  // Validation
  VALIDATION_INVALID_INPUT: 'VALIDATION_001',
  VALIDATION_MISSING_REQUIRED_FIELD: 'VALIDATION_002',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_001',

  // Server
  SERVER_INTERNAL_ERROR: 'SERVER_001',
  SERVER_SERVICE_UNAVAILABLE: 'SERVER_002'
} as const;

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Map backend error codes to user-friendly messages
 */
export const BackendErrorMessages: Record<string, ErrorDefinition> = {
  // Authentication
  [BackendErrors.AUTH_MISSING_TOKEN]: {
    code: BackendErrors.AUTH_MISSING_TOKEN,
    message: 'Authentication required',
    action: 'Please create a new guest session to continue'
  },
  [BackendErrors.AUTH_INVALID_TOKEN]: {
    code: BackendErrors.AUTH_INVALID_TOKEN,
    message: 'Invalid session',
    action: 'Your session is invalid. Please create a new guest session'
  },
  [BackendErrors.AUTH_EXPIRED_SESSION]: {
    code: BackendErrors.AUTH_EXPIRED_SESSION,
    message: 'Session expired',
    action: 'Your session has expired. Please create a new guest session'
  },
  [BackendErrors.AUTH_SESSION_NOT_FOUND]: {
    code: BackendErrors.AUTH_SESSION_NOT_FOUND,
    message: 'Session not found',
    action: 'Please create a new guest session to continue'
  },

  // Game
  [BackendErrors.GAME_NOT_FOUND]: {
    code: BackendErrors.GAME_NOT_FOUND,
    message: 'Game not found',
    action: 'The game no longer exists. Please create a new game'
  },
  [BackendErrors.GAME_INVALID_PHASE]: {
    code: BackendErrors.GAME_INVALID_PHASE,
    message: 'Invalid game phase',
    action: 'This action cannot be performed in the current game phase'
  },
  [BackendErrors.GAME_PLAYER_DEFEATED]: {
    code: BackendErrors.GAME_PLAYER_DEFEATED,
    message: 'You have been defeated',
    action: 'Your HP reached zero. Start a new game to continue playing'
  },

  // Card
  [BackendErrors.CARD_NOT_FOUND]: {
    code: BackendErrors.CARD_NOT_FOUND,
    message: 'Card not found',
    action: 'The card no longer exists or has been removed'
  },
  [BackendErrors.CARD_INVALID_SLOT]: {
    code: BackendErrors.CARD_INVALID_SLOT,
    message: 'Invalid equipment slot',
    action: 'Please select a valid equipment slot type'
  },
  [BackendErrors.CARD_SLOT_FULL]: {
    code: BackendErrors.CARD_SLOT_FULL,
    message: 'Equipment slot is full',
    action: 'Unequip a card from this slot or upgrade the slot capacity'
  },
  [BackendErrors.CARD_NOT_IN_HAND]: {
    code: BackendErrors.CARD_NOT_IN_HAND,
    message: 'Card not in hand',
    action: 'You can only equip cards from your hand'
  },

  // Combat
  [BackendErrors.COMBAT_INVALID_TARGET]: {
    code: BackendErrors.COMBAT_INVALID_TARGET,
    message: 'Invalid target',
    action: 'Please select a valid enemy card from the tavern'
  },
  [BackendErrors.COMBAT_TARGET_NOT_IN_TAVERN]: {
    code: BackendErrors.COMBAT_TARGET_NOT_IN_TAVERN,
    message: 'Target no longer available',
    action: 'The target card is no longer in the tavern. Please select another'
  },
  [BackendErrors.COMBAT_NO_ATTACK_POWER]: {
    code: BackendErrors.COMBAT_NO_ATTACK_POWER,
    message: 'No attack power',
    action: 'Equip cards in your HP slot to gain attack power'
  },
  [BackendErrors.COMBAT_PROCESSING]: {
    code: BackendErrors.COMBAT_PROCESSING,
    message: 'Combat in progress',
    action: 'Please wait for the current combat to finish'
  },

  // Validation
  [BackendErrors.VALIDATION_INVALID_INPUT]: {
    code: BackendErrors.VALIDATION_INVALID_INPUT,
    message: 'Invalid input',
    action: 'Please check your input and try again'
  },
  [BackendErrors.VALIDATION_MISSING_REQUIRED_FIELD]: {
    code: BackendErrors.VALIDATION_MISSING_REQUIRED_FIELD,
    message: 'Missing required field',
    action: 'Please provide all required information'
  },

  // Rate limiting
  [BackendErrors.RATE_LIMIT_EXCEEDED]: {
    code: BackendErrors.RATE_LIMIT_EXCEEDED,
    message: 'Too many requests',
    action: 'Please wait a moment before trying again'
  },

  // Server
  [BackendErrors.SERVER_INTERNAL_ERROR]: {
    code: BackendErrors.SERVER_INTERNAL_ERROR,
    message: 'Server error',
    action: 'An unexpected error occurred. Please try again'
  },
  [BackendErrors.SERVER_SERVICE_UNAVAILABLE]: {
    code: BackendErrors.SERVER_SERVICE_UNAVAILABLE,
    message: 'Service unavailable',
    action: 'The server is temporarily unavailable. Please try again later'
  }
};

/**
 * Get error definition from error code
 */
export function getErrorDefinition(code: string): ErrorDefinition {
  // Check frontend errors first
  const frontendError = Object.values(FrontendErrors).find(e => e.code === code);
  if (frontendError) {
    return frontendError;
  }

  // Check backend error mappings
  if (BackendErrorMessages[code]) {
    return BackendErrorMessages[code];
  }

  // Fallback to unknown error
  return FrontendErrors.UNKNOWN_ERROR;
}

/**
 * Determine error severity from error code
 */
export function getErrorSeverity(code: string): ErrorSeverity {
  // Critical errors (session/auth issues that require action)
  if (code.startsWith('AUTH_') || code.startsWith('WEBSOCKET_004')) {
    return ErrorSeverity.CRITICAL;
  }

  // Errors (user action failed)
  if (
    code.startsWith('COMBAT_') ||
    code.startsWith('CARD_') ||
    code.startsWith('GAME_') ||
    code.startsWith('VALIDATION_')
  ) {
    return ErrorSeverity.ERROR;
  }

  // Warnings (recoverable issues)
  if (code.startsWith('NETWORK_') || code.startsWith('WEBSOCKET_')) {
    return ErrorSeverity.WARNING;
  }

  // Default to error
  return ErrorSeverity.ERROR;
}

export type FrontendErrorKey = keyof typeof FrontendErrors;
export type BackendErrorCode = typeof BackendErrors[keyof typeof BackendErrors];
