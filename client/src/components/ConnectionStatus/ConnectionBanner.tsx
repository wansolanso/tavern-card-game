import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { ConnectionStatus } from '../../types/socket';

export const ConnectionBanner: React.FC = () => {
  const {
    status,
    isConnected,
    isConnecting,
    isReconnecting,
    isFailed,
    retryAttempt,
    reconnect,
  } = useConnectionStatus();

  const [showBanner, setShowBanner] = useState(false);
  const [hasBeenConnected, setHasBeenConnected] = useState(false);

  // Track if we've been connected at least once
  useEffect(() => {
    if (isConnected && !hasBeenConnected) {
      setHasBeenConnected(true);
    }
  }, [isConnected, hasBeenConnected]);

  // Show/hide banner based on connection status
  useEffect(() => {
    if (isConnecting && !hasBeenConnected) {
      // Show "Connecting..." on initial connection
      setShowBanner(true);
    } else if (isReconnecting || isFailed) {
      // Show banner when reconnecting or failed
      setShowBanner(true);
    } else if (isConnected) {
      // Hide banner after 3 seconds when connected
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowBanner(true);
    }
  }, [status, isConnected, isConnecting, isReconnecting, isFailed, hasBeenConnected]);

  // Don't render if we shouldn't show the banner
  if (!showBanner && isConnected) {
    return null;
  }

  // Determine banner content and styling
  const getBannerConfig = () => {
    switch (status) {
      case ConnectionStatus.CONNECTING:
        return {
          text: 'Connecting to server...',
          bgColor: 'bg-yellow-600',
          borderColor: 'border-yellow-500',
          icon: (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ),
          showRetry: false,
        };

      case ConnectionStatus.RECONNECTING:
        return {
          text: `Connection lost. Reconnecting... ${retryAttempt > 0 ? `(Attempt ${retryAttempt})` : ''}`,
          bgColor: 'bg-orange-600',
          borderColor: 'border-orange-500',
          icon: (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ),
          showRetry: false,
        };

      case ConnectionStatus.FAILED:
        return {
          text: 'Unable to connect. Check your internet connection.',
          bgColor: 'bg-red-600',
          borderColor: 'border-red-500',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
          showRetry: true,
        };

      case ConnectionStatus.CONNECTED:
        return {
          text: 'Connected!',
          bgColor: 'bg-green-600',
          borderColor: 'border-green-500',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ),
          showRetry: false,
        };

      default:
        return {
          text: 'Disconnected',
          bgColor: 'bg-gray-600',
          borderColor: 'border-gray-500',
          icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          ),
          showRetry: true,
        };
    }
  };

  const config = getBannerConfig();

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed top-0 left-0 right-0 z-50 ${config.bgColor} border-b-2 ${config.borderColor} shadow-lg`}
          role="alert"
          aria-live="polite"
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 text-white">
                  {config.icon}
                </div>
                <p className="text-sm font-medium text-white">
                  {config.text}
                </p>
              </div>

              {config.showRetry && (
                <button
                  onClick={reconnect}
                  className="flex-shrink-0 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium rounded transition-all duration-200"
                  aria-label="Retry connection"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
