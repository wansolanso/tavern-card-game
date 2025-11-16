import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { logger } from '../../utils/logger';
import { trackError } from '../../utils/errorTracking';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
  level?: 'app' | 'feature' | 'component';
  isolate?: boolean; // If true, prevents error from bubbling to parent boundaries
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: ErrorInfo;
  level?: 'app' | 'feature' | 'component';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches React errors in component tree and displays fallback UI.
 * Integrates with logger and error tracking services.
 *
 * Usage:
 * <ErrorBoundary level="app" fallback={AppErrorFallback}>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { level = 'component', onError, isolate } = this.props;

    // Update state with error info
    this.setState({
      errorInfo: errorInfo || null,
    });

    // Log to console and tracking service
    logger.error(
      `[ErrorBoundary:${level}] Caught error in component tree`,
      error,
      { componentStack: errorInfo.componentStack }
    );

    // Track error for monitoring
    trackError(error, {
      level,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Re-throw error if not isolated (let it bubble to parent boundaries)
    if (!isolate && level !== 'app') {
      // Note: In React, errors caught in componentDidCatch are already stopped
      // from bubbling. To allow bubbling, we'd need to throw in render.
      // For now, we keep errors isolated by default.
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error state if resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        this.resetError();
      }
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback: FallbackComponent, level } = this.props;

    if (hasError && error) {
      // Render fallback UI if provided
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            resetError={this.resetError}
            errorInfo={errorInfo || undefined}
            level={level}
          />
        );
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-tavern-dark p-4">
          <div className="max-w-2xl w-full bg-red-900 bg-opacity-20 border-2 border-red-500 rounded-lg p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">⚠️</span>
              <h1 className="text-2xl font-bold text-red-400">
                Something went wrong
              </h1>
            </div>

            <p className="text-gray-300 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>

            <button
              onClick={this.resetError}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
            >
              Try Again
            </button>

            {/* Show error details in development */}
            {import.meta.env.DEV && (
              <details className="mt-6">
                <summary className="cursor-pointer text-red-400 hover:text-red-300 font-semibold mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="bg-black bg-opacity-50 rounded p-4 overflow-auto">
                  <pre className="text-xs text-red-300 whitespace-pre-wrap">
                    {error.toString()}
                    {errorInfo?.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}
