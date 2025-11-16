/**
 * Custom Error Types
 * Type-safe error handling for the application
 */

/**
 * API Error
 * Thrown when API requests fail
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

/**
 * Socket Error
 * Thrown when Socket.io communication fails
 */
export class SocketError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SocketError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SocketError);
    }
  }
}

/**
 * Validation Error
 * Thrown when client-side validation fails
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Type guard for ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard for SocketError
 */
export function isSocketError(error: unknown): error is SocketError {
  return error instanceof SocketError;
}

/**
 * Type guard for ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard for Error instances
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Generic error handler type
 */
export type ErrorHandler = (error: Error | ApiError | SocketError | ValidationError) => void;

/**
 * Extract error message from unknown error
 * Safely extracts a displayable error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (isSocketError(error)) {
    return error.message;
  }

  if (isValidationError(error)) {
    return error.field
      ? `${error.field}: ${error.message}`
      : error.message;
  }

  if (isError(error)) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

/**
 * Extract error code from unknown error
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.code;
  }

  if (isSocketError(error)) {
    return error.code;
  }

  return undefined;
}

/**
 * Extract status code from error
 */
export function getErrorStatusCode(error: unknown): number | undefined {
  if (isApiError(error)) {
    return error.statusCode;
  }

  return undefined;
}
