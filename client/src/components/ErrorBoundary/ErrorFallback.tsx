import React from 'react';
import type { ErrorFallbackProps } from './ErrorBoundary';

/**
 * App-level Error Fallback
 *
 * Full-screen error display for catastrophic app failures.
 * Provides option to reload the entire application.
 */
export const AppErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  errorInfo,
}) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-tavern-dark to-black p-4">
      <div className="max-w-2xl w-full bg-red-900 bg-opacity-30 border-2 border-red-500 rounded-lg p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🏚️</div>
          <h1 className="text-3xl font-bold text-red-400 mb-2">
            The Tavern Has Collapsed!
          </h1>
          <p className="text-xl text-gray-300">
            A critical error has occurred in the game.
          </p>
        </div>

        <div className="bg-black bg-opacity-40 rounded-lg p-6 mb-6">
          <p className="text-gray-300 mb-4">
            Don't worry, your progress might be saved. Try one of these options:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
            <li>Retry the application</li>
            <li>Reload the page to start fresh</li>
            <li>Check your internet connection</li>
            <li>Clear your browser cache if the problem persists</li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={resetError}
            className="px-8 py-3 bg-tavern-gold hover:bg-yellow-600 text-tavern-dark font-bold rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
          <button
            onClick={handleReload}
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>

        {/* Development-only error details */}
        {import.meta.env.DEV && (
          <details className="mt-8">
            <summary className="cursor-pointer text-red-400 hover:text-red-300 font-semibold mb-3 text-center">
              🔧 Developer Information
            </summary>
            <div className="bg-black bg-opacity-60 rounded-lg p-4">
              <div className="mb-4">
                <h3 className="text-red-400 font-bold mb-2">Error Message:</h3>
                <pre className="text-xs text-red-300 whitespace-pre-wrap overflow-auto">
                  {error.name}: {error.message}
                </pre>
              </div>
              {error.stack && (
                <div className="mb-4">
                  <h3 className="text-red-400 font-bold mb-2">Stack Trace:</h3>
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap overflow-auto max-h-48">
                    {error.stack}
                  </pre>
                </div>
              )}
              {errorInfo?.componentStack && (
                <div>
                  <h3 className="text-red-400 font-bold mb-2">Component Stack:</h3>
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap overflow-auto max-h-48">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

/**
 * Game-level Error Fallback
 *
 * Error display for game board failures.
 * Provides option to return to lobby or retry.
 */
export const GameErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  errorInfo,
}) => {
  const handleReturnToLobby = () => {
    // Clear local state and reload to return to lobby
    sessionStorage.clear();
    window.location.reload();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-red-900 bg-opacity-20 border-2 border-red-500 rounded-lg p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">⚔️💥</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">
            Game Board Error
          </h2>
          <p className="text-gray-300">
            Something went wrong with the game board.
          </p>
        </div>

        <div className="bg-black bg-opacity-30 rounded p-4 mb-6">
          <p className="text-gray-400 text-sm">
            The game encountered an unexpected error. You can try to continue playing
            or return to the lobby to start a new game.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={resetError}
            className="px-6 py-3 bg-tavern-gold hover:bg-yellow-600 text-tavern-dark font-bold rounded-lg transition-colors"
          >
            Retry
          </button>
          <button
            onClick={handleReturnToLobby}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Return to Lobby
          </button>
        </div>

        {/* Development-only error details */}
        {import.meta.env.DEV && (
          <details className="mt-6">
            <summary className="cursor-pointer text-red-400 hover:text-red-300 text-sm font-semibold mb-2 text-center">
              Show Error Details
            </summary>
            <div className="bg-black bg-opacity-50 rounded p-3">
              <pre className="text-xs text-red-300 whitespace-pre-wrap overflow-auto max-h-32">
                {error.toString()}
                {errorInfo?.componentStack}
              </pre>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

/**
 * Card-level Error Fallback
 *
 * Minimal fallback for individual card rendering failures.
 * Shows placeholder card to prevent breaking the entire tavern.
 */
export const CardErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
}) => {
  const isDev = import.meta.env.DEV;

  return (
    <div
      className="bg-gray-800 rounded-lg p-4 border-2 border-red-500 border-dashed cursor-not-allowed"
      style={{ width: '160px', minHeight: '200px' }}
      title={isDev ? `Error: ${error.message}` : 'Card failed to load'}
    >
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-4xl mb-3 opacity-50">❌</div>
        <p className="text-xs text-red-400 font-semibold mb-2">
          Card Error
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Failed to render
        </p>
        {isDev && (
          <button
            onClick={resetError}
            className="text-xs px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded transition-colors"
          >
            Retry
          </button>
        )}
        {isDev && (
          <p className="text-xs text-gray-600 mt-2 truncate w-full" title={error.message}>
            {error.message}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * WebSocket Error Fallback
 *
 * Fallback for WebSocket connection errors.
 * Provides reconnection options.
 */
export const WebSocketErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
}) => {
  const handleReconnect = () => {
    resetError();
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 max-w-md bg-red-900 bg-opacity-90 border-2 border-red-500 rounded-lg p-4 shadow-2xl z-50">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🔌</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-red-400 mb-1">
            Connection Error
          </h3>
          <p className="text-sm text-gray-300 mb-3">
            Lost connection to the game server.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleReconnect}
              className="px-4 py-2 bg-tavern-gold hover:bg-yellow-600 text-tavern-dark text-sm font-bold rounded transition-colors"
            >
              Reconnect
            </button>
            <button
              onClick={resetError}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>

      {import.meta.env.DEV && (
        <details className="mt-3 pt-3 border-t border-red-700">
          <summary className="cursor-pointer text-xs text-red-400 hover:text-red-300">
            Error Details
          </summary>
          <pre className="text-xs text-gray-400 mt-2 overflow-auto max-h-24">
            {error.message}
          </pre>
        </details>
      )}
    </div>
  );
};
