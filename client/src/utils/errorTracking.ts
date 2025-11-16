/**
 * Error Tracking Utility
 *
 * Centralized error tracking for monitoring and debugging.
 * Prepared for Sentry integration while providing local tracking in development.
 */

import type { ErrorInfo } from 'react';

export interface ErrorContext {
  level?: 'app' | 'feature' | 'component';
  errorInfo?: ErrorInfo;
  componentStack?: string;
  userId?: string;
  sessionId?: string;
  gameState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ErrorLogEntry {
  timestamp: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: ErrorContext;
  userAgent: string;
  url: string;
}

class ErrorTracker {
  private sessionId: string;
  private errorCount: number = 0;
  private maxLogsInStorage: number = 100;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Generate unique session ID for tracking errors across session
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  }

  /**
   * Track an error with context
   */
  trackError(error: Error, context: ErrorContext = {}): void {
    this.errorCount++;

    const errorEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: {
        ...context,
        sessionId: this.sessionId,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      this.logToConsole(errorEntry);
    }

    // Store locally for debugging
    this.storeLocally(errorEntry);

    // Send to error tracking service in production
    if (import.meta.env.PROD) {
      this.sendToService(errorEntry);
    }

    // Track error frequency
    this.trackFrequency(error);
  }

  /**
   * Log error to console with formatting
   */
  private logToConsole(entry: ErrorLogEntry): void {
    console.group(`🚨 Error Tracked [${entry.context.level || 'unknown'}]`);
    console.error('Error:', entry.error);
    console.log('Context:', entry.context);
    console.log('Session ID:', this.sessionId);
    console.log('Error Count:', this.errorCount);
    console.groupEnd();
  }

  /**
   * Store error in sessionStorage for debugging
   */
  private storeLocally(entry: ErrorLogEntry): void {
    try {
      const existingLogs = sessionStorage.getItem('error_tracking_logs');
      const logs: ErrorLogEntry[] = existingLogs ? JSON.parse(existingLogs) : [];

      logs.push(entry);

      // Keep only the most recent errors
      if (logs.length > this.maxLogsInStorage) {
        logs.shift();
      }

      sessionStorage.setItem('error_tracking_logs', JSON.stringify(logs));

      // Also store error summary
      this.updateErrorSummary();
    } catch (storageError) {
      // Fail silently if storage is unavailable
      console.warn('Failed to store error locally:', storageError);
    }
  }

  /**
   * Update error summary in sessionStorage
   */
  private updateErrorSummary(): void {
    try {
      const summary = {
        sessionId: this.sessionId,
        errorCount: this.errorCount,
        lastError: new Date().toISOString(),
      };
      sessionStorage.setItem('error_tracking_summary', JSON.stringify(summary));
    } catch (e) {
      // Fail silently
    }
  }

  /**
   * Send error to external tracking service (Sentry, LogRocket, etc.)
   */
  private sendToService(entry: ErrorLogEntry): void {
    // TODO: Integrate with Sentry when configured
    // Example Sentry integration:
    /*
    if (window.Sentry) {
      window.Sentry.captureException(new Error(entry.error.message), {
        level: this.mapLevelToSentryLevel(entry.context.level),
        tags: {
          sessionId: this.sessionId,
          errorLevel: entry.context.level || 'unknown',
        },
        contexts: {
          react: {
            componentStack: entry.context.componentStack,
          },
          game: entry.context.gameState,
        },
        extra: entry.context.metadata,
      });
    }
    */

    // For now, prepare the payload for future integration
    const sentryPayload = {
      message: entry.error.message,
      name: entry.error.name,
      stack: entry.error.stack,
      level: entry.context.level,
      timestamp: entry.timestamp,
      sessionId: this.sessionId,
      context: entry.context,
    };

    // Store prepared payload for later
    if (import.meta.env.DEV) {
      console.log('📊 Prepared for Sentry:', sentryPayload);
    }
  }

  /**
   * Track error frequency to detect repeated errors
   */
  private trackFrequency(error: Error): void {
    try {
      const key = `error_freq_${error.name}_${error.message}`;
      const existing = sessionStorage.getItem(key);
      const count = existing ? parseInt(existing, 10) + 1 : 1;

      sessionStorage.setItem(key, count.toString());

      // Alert if error is repeating frequently
      if (count >= 5 && import.meta.env.DEV) {
        console.warn(
          `⚠️ Error occurring frequently (${count} times):`,
          error.message
        );
      }
    } catch (e) {
      // Fail silently
    }
  }

  /**
   * Get all tracked errors from current session
   */
  getErrorLogs(): ErrorLogEntry[] {
    try {
      const logs = sessionStorage.getItem('error_tracking_logs');
      return logs ? JSON.parse(logs) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Get error summary for current session
   */
  getErrorSummary(): { sessionId: string; errorCount: number; lastError?: string } {
    try {
      const summary = sessionStorage.getItem('error_tracking_summary');
      return summary ? JSON.parse(summary) : { sessionId: this.sessionId, errorCount: 0 };
    } catch (e) {
      return { sessionId: this.sessionId, errorCount: 0 };
    }
  }

  /**
   * Clear all error logs
   */
  clearErrorLogs(): void {
    try {
      sessionStorage.removeItem('error_tracking_logs');
      sessionStorage.removeItem('error_tracking_summary');
      this.errorCount = 0;
    } catch (e) {
      console.warn('Failed to clear error logs:', e);
    }
  }

  /**
   * Export error logs for debugging
   */
  exportErrorLogs(): string {
    const logs = this.getErrorLogs();
    const summary = this.getErrorSummary();

    const exportData = {
      summary,
      logs,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Export singleton instance
const errorTracker = new ErrorTracker();

/**
 * Track an error with context
 */
export const trackError = (error: Error, context?: ErrorContext): void => {
  errorTracker.trackError(error, context);
};

/**
 * Get all error logs from current session
 */
export const getErrorLogs = (): ErrorLogEntry[] => {
  return errorTracker.getErrorLogs();
};

/**
 * Get error summary
 */
export const getErrorSummary = (): ReturnType<typeof errorTracker.getErrorSummary> => {
  return errorTracker.getErrorSummary();
};

/**
 * Clear error logs
 */
export const clearErrorLogs = (): void => {
  errorTracker.clearErrorLogs();
};

/**
 * Export error logs as JSON string
 */
export const exportErrorLogs = (): string => {
  return errorTracker.exportErrorLogs();
};

/**
 * Development helper: Log error summary to console
 */
export const logErrorSummary = (): void => {
  if (import.meta.env.DEV) {
    const summary = getErrorSummary();
    const logs = getErrorLogs();

    console.group('📊 Error Tracking Summary');
    console.log('Session ID:', summary.sessionId);
    console.log('Total Errors:', summary.errorCount);
    console.log('Last Error:', summary.lastError);
    console.log('Recent Errors:', logs.slice(-5));
    console.groupEnd();
  }
};

// Export the tracker instance for advanced use cases
export default errorTracker;
