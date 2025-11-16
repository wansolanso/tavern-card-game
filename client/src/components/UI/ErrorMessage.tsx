import React from 'react';
import {
  getErrorDefinition,
  getErrorSeverity,
  ErrorSeverity,
  type ErrorDefinition
} from '../../constants/errors';

export interface ErrorMessageProps {
  code?: string;
  message?: string;
  action?: string;
  severity?: ErrorSeverity;
  onRetry?: () => void;
  onDismiss?: () => void;
  showCode?: boolean;
  className?: string;
}

/**
 * ErrorMessage Component
 *
 * Displays standardized error messages with consistent styling
 * Supports different severity levels and actions (retry/dismiss)
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  code,
  message,
  action,
  severity,
  onRetry,
  onDismiss,
  showCode = true,
  className = ''
}) => {
  // If code is provided, get error definition
  let errorDef: ErrorDefinition | null = null;
  let computedSeverity: ErrorSeverity = severity || ErrorSeverity.ERROR;

  if (code) {
    errorDef = getErrorDefinition(code);
    computedSeverity = severity || getErrorSeverity(code);
  }

  const displayMessage = message || errorDef?.message || 'An error occurred';
  const displayAction = action || errorDef?.action;
  const displayCode = showCode && (code || errorDef?.code);

  // Severity-based styling
  const severityStyles = {
    [ErrorSeverity.INFO]: {
      container: 'bg-blue-900 border-blue-500 text-blue-100',
      icon: 'ℹ️',
      codeText: 'text-blue-300'
    },
    [ErrorSeverity.WARNING]: {
      container: 'bg-yellow-900 border-yellow-500 text-yellow-100',
      icon: '⚠️',
      codeText: 'text-yellow-300'
    },
    [ErrorSeverity.ERROR]: {
      container: 'bg-red-900 border-red-500 text-red-100',
      icon: '❌',
      codeText: 'text-red-300'
    },
    [ErrorSeverity.CRITICAL]: {
      container: 'bg-red-950 border-red-600 text-red-50 shadow-lg shadow-red-900/50',
      icon: '🚨',
      codeText: 'text-red-200'
    }
  };

  const styles = severityStyles[computedSeverity];

  return (
    <div
      className={`${styles.container} border-2 rounded-lg p-4 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Header with icon and code */}
      <div className="flex items-start gap-3 mb-2">
        <span className="text-xl flex-shrink-0" aria-hidden="true">
          {styles.icon}
        </span>
        <div className="flex-1">
          {displayCode && (
            <div className={`text-xs font-mono mb-1 ${styles.codeText}`}>
              Error Code: {displayCode}
            </div>
          )}
          <div className="font-semibold text-lg leading-tight">
            {displayMessage}
          </div>
        </div>
      </div>

      {/* Action guidance */}
      {displayAction && (
        <div className="ml-9 text-sm opacity-90 mb-3">
          {displayAction}
        </div>
      )}

      {/* Action buttons */}
      {(onRetry || onDismiss) && (
        <div className="ml-9 flex gap-2 mt-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Retry action"
            >
              🔄 Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded font-semibold text-sm transition-all duration-200"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Inline error message (smaller, more compact)
 */
export interface InlineErrorProps {
  code?: string;
  message: string;
  showCode?: boolean;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  code,
  message,
  showCode = false
}) => {
  return (
    <div className="flex items-center gap-2 text-red-400 text-sm">
      <span aria-hidden="true">⚠️</span>
      <span>
        {showCode && code && <span className="font-mono mr-2">[{code}]</span>}
        {message}
      </span>
    </div>
  );
};

/**
 * Error banner (full-width notification)
 */
export interface ErrorBannerProps extends ErrorMessageProps {
  persistent?: boolean;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  code,
  message,
  action,
  severity = ErrorSeverity.ERROR,
  onRetry,
  onDismiss,
  persistent = false,
  showCode = true
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
      <ErrorMessage
        code={code}
        message={message}
        action={action}
        severity={severity}
        onRetry={onRetry}
        onDismiss={!persistent ? onDismiss : undefined}
        showCode={showCode}
        className="rounded-none border-x-0 border-t-0"
      />
    </div>
  );
};

/**
 * Error card (standalone error display)
 */
export interface ErrorCardProps extends ErrorMessageProps {
  title?: string;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  code,
  message,
  action,
  severity,
  title = 'Error',
  onRetry,
  onDismiss,
  showCode = true
}) => {
  return (
    <div className="bg-gray-800 rounded-lg border-2 border-gray-700 p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-red-400 mb-4">{title}</h2>
      <ErrorMessage
        code={code}
        message={message}
        action={action}
        severity={severity}
        onRetry={onRetry}
        onDismiss={onDismiss}
        showCode={showCode}
        className="bg-transparent border-0 p-0"
      />
    </div>
  );
};

export default ErrorMessage;
