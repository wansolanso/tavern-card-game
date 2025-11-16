import React from 'react';
import { motion } from 'framer-motion';
import type { ProgressBarProps } from '../../types';

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  color = 'bg-green-500',
  showLabel = true,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full h-6 bg-gray-700 rounded-full overflow-hidden border-2 border-gray-600">
        <motion.div
          className={`h-full ${color} flex items-center justify-center`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {showLabel && (
            <span className="text-xs font-bold text-white text-shadow drop-shadow-md">
              {current} / {max}
            </span>
          )}
        </motion.div>
      </div>
    </div>
  );
};
