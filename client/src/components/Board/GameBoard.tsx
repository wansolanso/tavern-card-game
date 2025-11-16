import React from 'react';
import { useGame, usePlayer, useCombat } from '../../store';
import { TavernCard } from '../Cards/TavernCard';
import { useCardTargeting } from '../../hooks/useCardTargeting';
import { useGameActions } from '../../hooks/useGameActions';
import { logger } from '../../utils/logger';
import { ErrorBoundary, CardErrorFallback } from '../ErrorBoundary';
import { Spinner } from '../UI/Spinner';

export const GameBoard: React.FC = () => {
  const game = useGame();
  const player = usePlayer();
  const combat = useCombat();
  const { attackTavernCard } = useGameActions();

  const { toggleTarget, isTargeted, selectedTarget, clearTarget, executeWithTarget } = useCardTargeting({
    allowedTypes: ['tavern'],
    onTargetSelected: (targetId, targetType) => {
      logger.debug('Target selected:', targetId, targetType);
    },
  });

  const handleAttack = () => {
    executeWithTarget((targetId) => {
      attackTavernCard(targetId);
      clearTarget();
    });
  };

  const selectedCard = game.tavernCards.find(card => String(card.id) === selectedTarget);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-6 relative">
      {/* Processing overlay */}
      {combat.isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-30 z-10 flex items-center justify-center rounded-lg pointer-events-none">
          <div className="bg-gray-900 px-6 py-4 rounded-lg border-2 border-tavern-gold shadow-xl">
            <Spinner size="lg" variant="inline" message="Processing combat..." />
          </div>
        </div>
      )}

      {/* Target Info Panel */}
      {selectedCard && (
        <div className="mb-4 bg-yellow-900 bg-opacity-50 border-2 border-yellow-400 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-yellow-400 font-bold text-lg">🎯 Target Selected:</span>
              <span className="text-white font-semibold">{selectedCard.name}</span>
              <div className="flex gap-3 text-sm">
                <span className="text-red-400">❤️ {selectedCard.current_hp} HP</span>
                <span className="text-blue-400">🛡️ {selectedCard.current_shield} Shield</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAttack}
                disabled={combat.isProcessing}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-bold transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                {combat.isProcessing ? (
                  <>
                    <Spinner size="sm" variant="inline" color="white" />
                    <span>Attacking...</span>
                  </>
                ) : (
                  <>
                    <span>⚔️ Attack</span>
                  </>
                )}
              </button>
              <button
                onClick={clearTarget}
                disabled={combat.isProcessing}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded font-semibold transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 h-full">
        {/* Tavern Area (Left) */}
        <div className="col-span-2 bg-gray-800 rounded-lg p-6 border-2 border-gray-700">
          <h2 className="text-2xl font-bold text-tavern-gold mb-4">
            Tavern Cards
            {selectedCard && (
              <span className="ml-3 text-sm text-yellow-400">(Click card to select/deselect target)</span>
            )}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {game.tavernCards.length === 0 ? (
              <div className="col-span-3 flex items-center justify-center h-64 text-gray-500">
                No tavern cards available
              </div>
            ) : (
              game.tavernCards.map((card) => (
                <ErrorBoundary
                  key={card.id}
                  level="component"
                  fallback={CardErrorFallback}
                  isolate={true}
                >
                  <TavernCard
                    card={card}
                    onClick={() => toggleTarget(String(card.id), 'tavern')}
                    isSelected={isTargeted(String(card.id))}
                  />
                </ErrorBoundary>
              ))
            )}
          </div>        </div>

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
