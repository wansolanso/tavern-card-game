import { FrontendErrors, BackendErrorMessages, getErrorDefinition, type ErrorDefinition } from '../constants/errors';
import { logger } from './logger';

/**
 * Standard error response from backend
 */
export interface BackendErrorResponse {
  status: 'error';
  error: {
    code: string;
    message: string;
    action: string;
    [key: string]: unknown;
  };
}

/**
 * Parse backend error response
 */
export function parseBackendError(error: unknown): ErrorDefinition {
  // Check if it's an Axios error with response
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: unknown } };
    const data = axiosError.response?.data;

    // Check if response matches BackendErrorResponse structure
    if (
      data &&
      typeof data === 'object' &&
      'error' in data &&
      data.error &&
      typeof data.error === 'object' &&
      'code' in data.error &&
      'message' in data.error &&
      'action' in data.error
    ) {
      const errorData = data.error as { code: string; message: string; action: string };
      return {
        code: errorData.code,
        message: errorData.message,
        action: errorData.action
      };
    }
  }

  // Check if it's a socket error event
  if (error && typeof error === 'object' && 'message' in error) {
    const socketError = error as { message: string; code?: string };
    if (socketError.code) {
      return getErrorDefinition(socketError.code);
    }
    // Return as-is if no code
    return {
      code: 'UNKNOWN_001',
      message: socketError.message,
      action: 'Please try again. If the problem persists, refresh the page'
    };
  }

  // Fallback to unknown error
  logger.error('Unable to parse error:', error);
  return FrontendErrors.UNKNOWN_ERROR;
}

/**
 * Handle network errors
 */
export function handleNetworkError(error: unknown): ErrorDefinition {
  // Check if browser is offline
  if (!navigator.onLine) {
    return FrontendErrors.NETWORK_OFFLINE;
  }

  // Check for timeout errors
  if (error && typeof error === 'object') {
    const err = error as { code?: string; message?: string };
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return FrontendErrors.NETWORK_TIMEOUT;
    }
  }

  // Generic network error
  return FrontendErrors.NETWORK_ERROR;
}

/**
 * Handle WebSocket errors
 */
export function handleWebSocketError(
  reason: string,
  retryAttempt: number = 0
): ErrorDefinition {
  // Server disconnected
  if (reason === 'io server disconnect') {
    return FrontendErrors.WEBSOCKET_FAILED;
  }

  // Transport error (connection failed)
  if (reason === 'transport error' || reason === 'transport close') {
    if (retryAttempt > 5) {
      return FrontendErrors.WEBSOCKET_MAX_RETRIES;
    }
    return FrontendErrors.WEBSOCKET_RECONNECTING;
  }

  // Generic disconnection
  return FrontendErrors.WEBSOCKET_DISCONNECTED;
}

/**
 * Create user-friendly error message
 *
 * Converts any error into a standardized ErrorDefinition
 */
export function createUserFriendlyError(error: unknown, context?: string): ErrorDefinition {
  // Parse backend errors first
  const backendError = parseBackendError(error);
  if (backendError.code !== 'UNKNOWN_001') {
    return backendError;
  }

  // Check for network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return handleNetworkError(error);
  }

  // Check for Error objects
  if (error instanceof Error) {
    logger.error(`Error in ${context || 'unknown context'}:`, error);
    return {
      code: 'UI_002',
      message: 'Component error',
      action: 'An error occurred. Please refresh the page'
    };
  }

  // Fallback
  logger.error(`Unhandled error in ${context || 'unknown context'}:`, error);
  return FrontendErrors.UNKNOWN_ERROR;
}

/**
 * Log error with context
 */
export function logError(error: unknown, context: string, additionalInfo?: Record<string, unknown>): void {
  const errorDef = createUserFriendlyError(error, context);

  logger.error(
    `[${errorDef.code}] ${context}: ${errorDef.message}`,
    error,
    additionalInfo
  );
}

/**
 * Determine if error is recoverable
 *
 * Some errors can be retried, others require page refresh or new session
 */
export function isRecoverableError(code: string): boolean {
  // Non-recoverable errors (require page refresh or new session)
  const nonRecoverable = [
    'AUTH_001', 'AUTH_002', 'AUTH_003', 'AUTH_004', // Auth errors
    'WEBSOCKET_004', // Max retries
    'STATE_002', // Corrupted state
    'UI_002', 'UI_003' // Component errors
  ];

  return !nonRecoverable.includes(code);
}

/**
 * Get suggested action for error code
 */
export function getSuggestedAction(code: string): 'retry' | 'refresh' | 'new-session' | 'dismiss' {
  // Errors requiring new session
  if (code.startsWith('AUTH_')) {
    return 'new-session';
  }

  // Errors requiring page refresh
  if (code.startsWith('STATE_') || code.startsWith('UI_') || code === 'WEBSOCKET_004') {
    return 'refresh';
  }

  // Errors that can be retried
  if (
    code.startsWith('COMBAT_') ||
    code.startsWith('CARD_') ||
    code.startsWith('NETWORK_') ||
    code.startsWith('WEBSOCKET_') ||
    code.startsWith('LOADING_')
  ) {
    return 'retry';
  }

  // Default to dismiss
  return 'dismiss';
}

/**
 * Format error for display in notification
 */
export interface NotificationError {
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: () => void;
  actionLabel?: string;
}

export function formatErrorForNotification(
  error: unknown,
  context?: string,
  onRetry?: () => void
): NotificationError {
  const errorDef = createUserFriendlyError(error, context);
  const suggestedAction = getSuggestedAction(errorDef.code);

  let type: 'error' | 'warning' | 'info' = 'error';
  let duration = 5000;

  // Adjust type and duration based on severity
  if (errorDef.code.startsWith('NETWORK_') || errorDef.code.startsWith('WEBSOCKET_')) {
    type = 'warning';
    duration = 8000;
  }

  const notification: NotificationError = {
    type,
    title: errorDef.message,
    message: errorDef.action,
    duration
  };

  // Add action if applicable
  if (suggestedAction === 'retry' && onRetry) {
    notification.action = onRetry;
    notification.actionLabel = 'Retry';
  } else if (suggestedAction === 'refresh') {
    notification.action = () => window.location.reload();
    notification.actionLabel = 'Refresh';
  } else if (suggestedAction === 'new-session') {
    notification.action = () => {
      // Clear session and redirect to lobby
      sessionStorage.clear();
      window.location.href = '/';
    };
    notification.actionLabel = 'New Session';
  }

  return notification;
}

export default {
  parseBackendError,
  handleNetworkError,
  handleWebSocketError,
  createUserFriendlyError,
  logError,
  isRecoverableError,
  getSuggestedAction,
  formatErrorForNotification
};
