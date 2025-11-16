import React from 'react';
import { motion } from 'framer-motion';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Base Skeleton component for loading placeholders
 *
 * @example
 * ```tsx
 * <Skeleton variant="rectangular" width="100%" height="200px" />
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="text" />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animate = true,
}) => {
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height ?? (variant === 'text' ? '1em' : undefined),
  };

  const baseClasses = `bg-gray-700 ${variantClasses[variant]} ${className}`;

  if (animate) {
    return (
      <motion.div
        className={baseClasses}
        style={style}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    );
  }

  return <div className={baseClasses} style={style} />;
};

/**
 * Card skeleton for tavern cards loading state
 */
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`bg-gray-800 rounded-lg border-2 border-gray-700 overflow-hidden ${className}`}
      style={{ width: '200px', height: '280px' }}
    >
      {/* Card image placeholder */}
      <Skeleton variant="rectangular" height="140px" className="rounded-none" />

      {/* Card content */}
      <div className="p-4 space-y-3">
        {/* Card name */}
        <Skeleton variant="text" width="80%" height="20px" />

        {/* Stats row */}
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width="60px" height="24px" />
          <Skeleton variant="rectangular" width="60px" height="24px" />
        </div>

        {/* Description lines */}
        <div className="space-y-2">
          <Skeleton variant="text" width="100%" height="12px" />
          <Skeleton variant="text" width="90%" height="12px" />
          <Skeleton variant="text" width="75%" height="12px" />
        </div>
      </div>
    </div>
  );
};

/**
 * Tavern grid skeleton - shows multiple card skeletons in grid layout
 */
export const TavernSkeleton: React.FC<{ count?: number }> = ({ count = 9 }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Player stats skeleton
 */
export const PlayerStatsSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height="16px" />
          <Skeleton variant="text" width="40%" height="12px" />
        </div>
      </div>

      {/* HP bar */}
      <div className="space-y-1">
        <Skeleton variant="text" width="30%" height="12px" />
        <Skeleton variant="rectangular" width="100%" height="24px" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Skeleton variant="rectangular" width="100%" height="40px" />
        <Skeleton variant="rectangular" width="100%" height="40px" />
      </div>
    </div>
  );
};

/**
 * Equipment slot skeleton
 */
export const EquipmentSlotSkeleton: React.FC = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-3 border-2 border-gray-700">
      <Skeleton variant="text" width="50%" height="14px" className="mb-2" />
      <Skeleton variant="rectangular" width="100%" height="60px" />
    </div>
  );
};

/**
 * Combat log skeleton
 */
export const CombatLogSkeleton: React.FC<{ entries?: number }> = ({ entries = 5 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: entries }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width={`${60 + Math.random() * 30}%`} height="14px" />
        </div>
      ))}
    </div>
  );
};

/**
 * Button skeleton for loading buttons
 */
export const ButtonSkeleton: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}> = ({ size = 'md', fullWidth = false }) => {
  const heights = {
    sm: '32px',
    md: '40px',
    lg: '48px',
  };

  return (
    <Skeleton
      variant="rectangular"
      height={heights[size]}
      width={fullWidth ? '100%' : '120px'}
      className="rounded-lg"
    />
  );
};

/**
 * Table row skeleton
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => {
  return (
    <tr className="border-b border-gray-700">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-3">
          <Skeleton variant="text" width="80%" height="16px" />
        </td>
      ))}
    </tr>
  );
};

/**
 * Full page loading skeleton
 */
export const GameBoardSkeleton: React.FC = () => {
  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Tavern area skeleton */}
        <div className="col-span-2 bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
          <Skeleton variant="text" width="200px" height="32px" className="mb-4" />
          <TavernSkeleton count={6} />
        </div>

        {/* Player area skeleton */}
        <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
          <Skeleton variant="text" width="150px" height="32px" className="mb-4" />
          <div className="space-y-4">
            <EquipmentSlotSkeleton />
            <EquipmentSlotSkeleton />
            <EquipmentSlotSkeleton />
          </div>

          <div className="mt-6">
            <Skeleton variant="text" width="100px" height="24px" className="mb-2" />
            <CombatLogSkeleton entries={3} />
          </div>
        </div>
      </div>
    </div>
  );
};
