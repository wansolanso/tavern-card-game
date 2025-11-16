import React from 'react';
import { motion } from 'framer-motion';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'inline' | 'overlay' | 'fullscreen';
  message?: string;
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const colorClasses = {
  primary: 'text-tavern-gold',
  white: 'text-white',
  gray: 'text-gray-400',
};

/**
 * Spinner component for loading states
 *
 * Variants:
 * - inline: Small spinner for inline use (buttons, etc)
 * - overlay: Spinner with backdrop overlay
 * - fullscreen: Full-screen loading state
 *
 * @example
 * ```tsx
 * // Inline spinner
 * <Spinner size="sm" variant="inline" />
 *
 * // Overlay spinner with message
 * <Spinner variant="overlay" message="Creating game..." />
 *
 * // Fullscreen loading
 * <Spinner variant="fullscreen" size="xl" message="Loading..." />
 * ```
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'inline',
  message,
  color = 'primary',
  className = '',
}) => {
  const spinnerElement = (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label={message || 'Loading'}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Inline variant - just the spinner
  if (variant === 'inline') {
    return message ? (
      <div className="flex items-center gap-2">
        {spinnerElement}
        <span className="text-sm">{message}</span>
      </div>
    ) : (
      spinnerElement
    );
  }

  // Overlay variant - spinner with backdrop
  if (variant === 'overlay') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg"
      >
        <div className="flex flex-col items-center gap-3 bg-gray-800 px-8 py-6 rounded-lg border-2 border-tavern-gold shadow-xl">
          {spinnerElement}
          {message && (
            <p className="text-white font-semibold text-lg">{message}</p>
          )}
        </div>
      </motion.div>
    );
  }

  // Fullscreen variant - covers entire viewport
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-b from-tavern-dark to-tavern-wood bg-opacity-95 flex items-center justify-center z-50"
    >
      <div className="flex flex-col items-center gap-4">
        {spinnerElement}
        {message && (
          <p className="text-tavern-gold font-bold text-2xl animate-pulse">
            {message}
          </p>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Loading dots animation for subtle loading states
 */
export const LoadingDots: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-current rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Pulsing spinner alternative - good for card loading states
 */
export const PulseSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      className={`${sizeMap[size]} border-4 border-tavern-gold rounded-full`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};
