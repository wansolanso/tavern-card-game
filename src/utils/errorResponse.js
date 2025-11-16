const { ErrorMessages } = require('../constants/errors');
const logger = require('./logger');

/**
 * Create standardized error response object
 *
 * @param {string} errorKey - Key from ErrorMessages constant
 * @param {Object} additionalContext - Additional context to include in response
 * @returns {Object} Standardized error response
 */
function createErrorResponse(errorKey, additionalContext = {}) {
  const error = ErrorMessages[errorKey];

  if (!error) {
    logger.error(`Unknown error key: ${errorKey}`);
    return {
      status: 'error',
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        action: 'Please try again or contact support',
        ...additionalContext
      }
    };
  }

  return {
    status: 'error',
    error: {
      code: error.code,
      message: error.message,
      action: error.action,
      ...additionalContext
    }
  };
}

/**
 * Send standardized error response
 *
 * @param {Object} res - Express response object
 * @param {string} errorKey - Key from ErrorMessages constant
 * @param {number} statusCode - Optional override for status code
 * @param {Object} additionalContext - Additional context to include
 */
function sendErrorResponse(res, errorKey, statusCode = null, additionalContext = {}) {
  const error = ErrorMessages[errorKey];
  const response = createErrorResponse(errorKey, additionalContext);

  // Log error with code and context
  logger.error(
    `[${error?.code || 'UNKNOWN'}] ${error?.message || 'Unknown error'}`,
    additionalContext
  );

  // Use provided status code or fall back to error's status code
  const httpStatus = statusCode || error?.statusCode || 500;

  res.status(httpStatus).json(response);
}

/**
 * Create enhanced error object with error code
 *
 * Extends standard Error with code and statusCode properties
 * for use in services and repositories
 *
 * @param {string} errorKey - Key from ErrorMessages constant
 * @param {Object} additionalContext - Additional context
 * @returns {Error} Enhanced error object
 */
function createEnhancedError(errorKey, additionalContext = {}) {
  const errorDef = ErrorMessages[errorKey];

  if (!errorDef) {
    logger.error(`Unknown error key: ${errorKey}`);
    const error = new Error('An unexpected error occurred');
    error.code = 'UNKNOWN_ERROR';
    error.statusCode = 500;
    error.action = 'Please try again or contact support';
    return error;
  }

  const error = new Error(errorDef.message);
  error.code = errorDef.code;
  error.statusCode = errorDef.statusCode;
  error.action = errorDef.action;
  error.context = additionalContext;

  return error;
}

/**
 * Map existing error classes to standardized error codes
 *
 * Provides backward compatibility with existing error handling
 *
 * @param {Error} error - The original error
 * @returns {string|null} Error key from ErrorMessages or null
 */
function mapErrorToStandardCode(error) {
  if (!error) return null;

  // Map by error name
  const errorTypeMap = {
    'ValidationError': 'VALIDATION_INVALID_INPUT',
    'NotFoundError': 'RESOURCE_NOT_FOUND',
    'UnauthorizedError': 'AUTH_INVALID_TOKEN',
    'ForbiddenError': 'AUTH_INVALID_TOKEN',
    'ConflictError': 'RESOURCE_CONFLICT'
  };

  // Check if error has a name mapping
  if (error.name && errorTypeMap[error.name]) {
    return errorTypeMap[error.name];
  }

  // Check if error message contains specific keywords
  const message = error.message?.toLowerCase() || '';

  if (message.includes('session') && message.includes('expired')) {
    return 'AUTH_EXPIRED_SESSION';
  }
  if (message.includes('token') && message.includes('invalid')) {
    return 'AUTH_INVALID_TOKEN';
  }
  if (message.includes('not found') && message.includes('game')) {
    return 'GAME_NOT_FOUND';
  }
  if (message.includes('not found') && message.includes('card')) {
    return 'CARD_NOT_FOUND';
  }
  if (message.includes('slot') && message.includes('full')) {
    return 'CARD_SLOT_FULL';
  }
  if (message.includes('invalid slot')) {
    return 'CARD_INVALID_SLOT';
  }
  if (message.includes('target') && message.includes('tavern')) {
    return 'COMBAT_TARGET_NOT_IN_TAVERN';
  }
  if (message.includes('no attack power')) {
    return 'COMBAT_NO_ATTACK_POWER';
  }

  // Default to server error if no mapping found
  return 'SERVER_INTERNAL_ERROR';
}

/**
 * Express error handler middleware
 *
 * Catches all errors and sends standardized responses
 * Should be registered as the last middleware
 */
function errorHandlerMiddleware(err, req, res, next) {
  // If response already sent, pass to default handler
  if (res.headersSent) {
    return next(err);
  }

  // Check if error has a standardized code already
  let errorKey = null;

  if (err.code && Object.values(ErrorMessages).some(e => e.code === err.code)) {
    // Find error key from code
    errorKey = Object.keys(ErrorMessages).find(
      key => ErrorMessages[key].code === err.code
    );
  }

  // If no standardized code, try to map from error type
  if (!errorKey) {
    errorKey = mapErrorToStandardCode(err);
  }

  // Include original error message in additional context for debugging
  const additionalContext = {
    ...(err.context || {}),
    ...(process.env.NODE_ENV === 'development' && {
      originalMessage: err.message,
      stack: err.stack
    })
  };

  sendErrorResponse(res, errorKey, err.statusCode, additionalContext);
}

module.exports = {
  createErrorResponse,
  sendErrorResponse,
  createEnhancedError,
  mapErrorToStandardCode,
  errorHandlerMiddleware
};
