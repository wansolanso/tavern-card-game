import React from 'react';
import type { PlayerStatsProps } from '../../types';
import { ProgressBar } from '../UI/ProgressBar';

export const PlayerStats: React.FC<PlayerStatsProps> = ({
  hp,
  maxHp,
  level,
  score,
  compact = false,
}) => {
  return (
    <div className={`flex ${compact ? 'flex-col gap-2' : 'items-center gap-6'} bg-gray-800 p-4 rounded-lg border-2 border-tavern-gold`}>
      {/* HP */}
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-red-400">Health</span>
          <span className="text-xs text-gray-400">
            {hp} / {maxHp}
          </span>
        </div>
        <ProgressBar current={hp} max={maxHp} color="bg-red-500" showLabel={false} />
      </div>

      {/* Level */}
      <div className="flex items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-tavern-gold flex items-center justify-center">
          <span className="text-2xl font-bold text-tavern-dark">{level}</span>
        </div>
        <span className="text-sm font-semibold text-gray-300">Level</span>
      </div>

      {/* Score */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">⭐</span>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400">Score</span>
          <span className="text-lg font-bold text-tavern-gold">{score.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
