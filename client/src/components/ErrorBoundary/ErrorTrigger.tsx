import React, { useState } from 'react';
import { getErrorLogs, exportErrorLogs, clearErrorLogs } from '../../utils/errorTracking';
import { logger } from '../../utils/logger';

/**
 * Error Trigger Component (Development Only)
 *
 * Utility component for testing error boundaries in development.
 * Provides buttons to trigger various types of errors.
 *
 * Usage:
 * Import and add to your component tree only in development:
 * {import.meta.env.DEV && <ErrorTrigger />}
 */

interface ErrorTriggerProps {
  children?: React.ReactNode;
}

const ThrowErrorComponent: React.FC<{ shouldThrow: boolean; errorType: string }> = ({
  shouldThrow,
  errorType,
}) => {
  if (!shouldThrow) {
    return <div className="text-green-400 text-sm">Ready to throw error...</div>;
  }

  // Trigger different types of errors
  switch (errorType) {
    case 'render':
      throw new Error('Test Error: Render error thrown intentionally');

    case 'null-reference':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nullObj: any = null;
      return <div>{nullObj.property}</div>;

    case 'type-error':
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const num: any = 123;
      return <div>{num.map((x: number) => x)}</div>;

    case 'async':
      Promise.reject(new Error('Test Error: Async error thrown intentionally'));
      return <div>Async error triggered</div>;

    default:
      throw new Error('Test Error: Unknown error type');
  }
};

export const ErrorTrigger: React.FC<ErrorTriggerProps> = ({ children }) => {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [errorType, setErrorType] = useState<string>('render');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Only render in development
  if (import.meta.env.PROD) {
    return null;
  }

  const handleTriggerError = (type: string) => {
    setErrorType(type);
    setShouldThrow(true);
    // Reset after a moment to allow re-triggering
    setTimeout(() => setShouldThrow(false), 100);
  };

  const handleExportLogs = () => {
    const logs = exportErrorLogs();
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    clearErrorLogs();
    logger.clearErrorBoundaryLogs();
    alert('Error logs cleared!');
  };

  const errorLogs = getErrorLogs();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm flex items-center gap-2"
        title="Error Boundary Testing Tools (Dev Only)"
      >
        🔧 Error Testing
        <span className="text-xs">
          {isExpanded ? '▼' : '▲'}
        </span>
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute bottom-14 right-0 bg-gray-900 border-2 border-purple-500 rounded-lg shadow-2xl p-4 w-96">
          <div className="mb-4">
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              🔧 Error Boundary Testing
              <span className="text-xs text-purple-400">(Dev Only)</span>
            </h3>
            <p className="text-xs text-gray-400">
              Test error boundaries by triggering various error types
            </p>
          </div>

          {/* Error Type Buttons */}
          <div className="space-y-2 mb-4">
            <h4 className="text-sm text-gray-400 font-semibold mb-2">Trigger Errors:</h4>

            <button
              onClick={() => handleTriggerError('render')}
              className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold transition-colors"
            >
              🔴 Render Error
            </button>

            <button
              onClick={() => handleTriggerError('null-reference')}
              className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-semibold transition-colors"
            >
              🟠 Null Reference Error
            </button>

            <button
              onClick={() => handleTriggerError('type-error')}
              className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-semibold transition-colors"
            >
              🟡 Type Error
            </button>

            <button
              onClick={() => handleTriggerError('async')}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition-colors"
            >
              🔵 Async Error (Not caught by boundaries)
            </button>
          </div>

          {/* Error Logs Section */}
          <div className="border-t border-gray-700 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm text-gray-400 font-semibold">
                Error Logs ({errorLogs.length})
              </h4>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                {showLogs ? 'Hide' : 'Show'}
              </button>
            </div>

            {showLogs && (
              <div className="bg-black bg-opacity-50 rounded p-2 mb-2 max-h-48 overflow-auto">
                {errorLogs.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No errors logged yet</p>
                ) : (
                  <div className="space-y-2">
                    {errorLogs.slice(-5).reverse().map((log, index) => (
                      <div key={index} className="text-xs border-b border-gray-800 pb-2">
                        <div className="text-red-400 font-semibold">
                          {log.error.name}: {log.error.message}
                        </div>
                        <div className="text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleExportLogs}
                disabled={errorLogs.length === 0}
                className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-xs font-semibold transition-colors"
              >
                📥 Export
              </button>
              <button
                onClick={handleClearLogs}
                disabled={errorLogs.length === 0}
                className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded text-xs font-semibold transition-colors"
              >
                🗑️ Clear
              </button>
            </div>
          </div>

          {/* Instructions */}
          <details className="mt-3 pt-3 border-t border-gray-700">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
              ℹ️ Instructions
            </summary>
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>• Click error buttons to trigger different error types</p>
              <p>• Errors are caught by nearest error boundary</p>
              <p>• Check console for detailed error logs</p>
              <p>• Export logs to review error tracking data</p>
              <p>• Async errors won't be caught by boundaries</p>
            </div>
          </details>
        </div>
      )}

      {/* Hidden error throwing component */}
      {children}
      {shouldThrow && <ThrowErrorComponent shouldThrow={shouldThrow} errorType={errorType} />}
    </div>
  );
};
