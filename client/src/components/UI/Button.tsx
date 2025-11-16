import React from 'react';
import { motion } from 'framer-motion';
import type { ButtonProps } from '../../types';

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-tavern-dark disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-tavern-gold text-tavern-dark hover:bg-opacity-90 focus:ring-tavern-gold',
    secondary: 'bg-tavern-wood text-white hover:bg-opacity-90 focus:ring-tavern-wood',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
    ghost: 'bg-transparent border-2 border-tavern-gold text-tavern-gold hover:bg-tavern-gold hover:text-tavern-dark focus:ring-tavern-gold',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const { onClick, type } = props;

  return (
    <motion.button
      className={classes}
      disabled={disabled || isLoading}
      onClick={onClick}
      type={type}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
};
