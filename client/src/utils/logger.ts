/**
 * Frontend Logger Utility
 *
 * Replaces console.log/error with environment-aware logging.
 * In production, logs are suppressed or sent to error tracking services.
 * In development, logs are formatted and displayed in console.
 */

interface LoggerConfig {
  enableDebug: boolean;
  enableInfo: boolean;
  enableWarn: boolean;
  enableError: boolean;
  sendToErrorTracking: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    const isDevelopment = import.meta.env.MODE === 'development';

    this.config = {
      enableDebug: isDevelopment,
      enableInfo: isDevelopment,
      enableWarn: true,
      enableError: true,
      sendToErrorTracking: !isDevelopment
    };
  }

  /**
   * Debug level logging - only visible in development
   * Use for detailed debugging information
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.config.enableDebug) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Info level logging - general information
   * Use for normal application flow events
   */
  info(message: string, ...args: unknown[]): void {
    if (this.config.enableInfo) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Warning level logging
   * Use for recoverable errors or unexpected situations
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.config.enableWarn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  /**
   * Error level logging
   * Use for errors that affect functionality
   * In production, sends to error tracking service
   */
  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (this.config.enableError) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }

    // Send to error tracking service in production
    if (this.config.sendToErrorTracking && error) {
      this.sendToErrorTracker(message, error);
    }
  }

  /**
   * Send error to tracking service (Sentry, LogRocket, etc.)
   * Implement when error tracking service is configured
   */
  private sendToErrorTracker(message: string, error: unknown): void {
    // TODO: Integrate with Sentry or similar service
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     tags: { message }
    //   });
    // }

    // For now, just store critical errors for manual review
    const errorLog = {
      timestamp: new Date().toISOString(),
      message,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : String(error)
    };

    // Store in sessionStorage for debugging
    try {
      const existingLogs = sessionStorage.getItem('error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(errorLog);

      // Keep only last 50 errors
      if (logs.length > 50) {
        logs.shift();
      }

      sessionStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (e) {
      // Fail silently if sessionStorage is unavailable
    }
  }

  /**
   * Group related logs together
   */
  group(label: string): void {
    if (this.config.enableDebug) {
      console.group(label);
    }
  }

  /**
   * End log group
   */
  groupEnd(): void {
    if (this.config.enableDebug) {
      console.groupEnd();
    }
  }

  /**
   * Log table data (useful for arrays/objects)
   */
  table(data: unknown): void {
    if (this.config.enableDebug) {
      console.table(data);
    }
  }

  /**
   * Performance timing
   */
  time(label: string): void {
    if (this.config.enableDebug) {
      console.time(label);
    }
  }

  /**
   * End performance timing
   */
  timeEnd(label: string): void {
    if (this.config.enableDebug) {
      console.timeEnd(label);
    }
  }

  /**
   * Log error caught by Error Boundary
   * Includes component stack trace and additional context
   */
  logErrorBoundary(
    error: Error,
    errorInfo: { componentStack?: string },
    level: string = 'component'
  ): void {
    this.error(`[ErrorBoundary:${level}]`, error, errorInfo);

    // Store error boundary specific logs
    const errorBoundaryLog = {
      timestamp: new Date().toISOString(),
      level,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
    };

    try {
      const existingLogs = sessionStorage.getItem('error_boundary_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(errorBoundaryLog);

      // Keep only last 30 error boundary logs
      if (logs.length > 30) {
        logs.shift();
      }

      sessionStorage.setItem('error_boundary_logs', JSON.stringify(logs));
    } catch (e) {
      // Fail silently if sessionStorage is unavailable
    }
  }

  /**
   * Get error boundary logs from session storage
   */
  getErrorBoundaryLogs(): unknown[] {
    try {
      const logs = sessionStorage.getItem('error_boundary_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Clear error boundary logs
   */
  clearErrorBoundaryLogs(): void {
    try {
      sessionStorage.removeItem('error_boundary_logs');
    } catch (e) {
      // Fail silently
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Also export as default
export default logger;
