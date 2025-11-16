import React from 'react';
import { usePlayer, useGame } from '../../store';
import { PlayerStats } from './PlayerStats';

export const GameHeader: React.FC = () => {
  const player = usePlayer();
  const game = useGame();

  return (
    <header className="w-full bg-tavern-wood border-b-4 border-tavern-gold p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Game Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-tavern-gold text-shadow">
            ⚔️ Tavern Card Game
          </h1>
          {game.phase !== 'lobby' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg">
              <span className="text-sm text-gray-400">Turn</span>
              <span className="text-lg font-bold text-white">{game.turn}</span>
            </div>
          )}
        </div>

        {/* Player Stats */}
        {game.phase !== 'lobby' && (
          <PlayerStats
            hp={player.hp}
            maxHp={player.maxHp}
            level={player.level}
            score={player.score}
          />
        )}

        {/* Phase Indicator */}
        <div className="flex items-center gap-2">
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            game.phase === 'tavern' ? 'bg-green-600' :
            game.phase === 'boss' ? 'bg-red-600' :
            game.phase === 'gameover' ? 'bg-gray-600' :
            'bg-blue-600'
          }`}>
            {game.phase.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};
