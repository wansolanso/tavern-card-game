import React from 'react';
import { useGame, usePlayer } from '../../store';

export const GameBoard: React.FC = () => {
  const game = useGame();
  const player = usePlayer();

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-6">
      <div className="grid grid-cols-3 gap-6 h-full">
        {/* Tavern Area (Left) */}
        <div className="col-span-2 bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
          <h2 className="text-2xl font-bold text-tavern-gold mb-4">Tavern Cards</h2>
          <div className="grid grid-cols-3 gap-4">
            {game.tavernCards.length === 0 ? (
              <div className="col-span-3 flex items-center justify-center h-64 text-gray-500">
                No tavern cards available
              </div>
            ) : (
              game.tavernCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-gray-700 rounded-lg p-4 border-2 border-gray-600"
                >
                  <h3 className="font-bold text-white">{card.name}</h3>
                  <p className="text-sm text-gray-400">{card.type}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Player Area (Right) */}
        <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
          <h2 className="text-2xl font-bold text-tavern-gold mb-4">Equipment</h2>
          <div className="flex flex-col gap-4">
            {Object.entries(player.equippedCards).map(([slot, card]) => (
              <div
                key={slot}
                className="slot-container"
              >
                {card ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">{card.name}</p>
                    <p className="text-xs text-gray-400">{slot}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">{slot.toUpperCase()}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-bold text-tavern-gold mb-2">Hand</h3>
            <div className="flex flex-col gap-2">
              {player.hand.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Empty hand</p>
              ) : (
                player.hand.map((card) => (
                  <div
                    key={card.id}
                    className="bg-gray-700 rounded p-2 border border-gray-600"
                  >
                    <p className="text-sm font-semibold text-white">{card.name}</p>
                    <p className="text-xs text-gray-400">{card.type}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
