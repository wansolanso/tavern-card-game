import React, { useState } from 'react';
import { useGame, usePlayer, useCombat, usePlayerActions, useUIActions } from '../../store';
import { TavernCard } from '../Cards/TavernCard';
import { HandCard } from '../Cards/HandCard';
import { useCardTargeting } from '../../hooks/useCardTargeting';
import { useGameActions } from '../../hooks/useGameActions';
import { logger } from '../../utils/logger';
import { ErrorBoundary, CardErrorFallback } from '../ErrorBoundary';
import { Spinner } from '../UI/Spinner';
import apiClient from '../../config/axios';
import { API_ENDPOINTS } from '../../config/constants';

export const GameBoard: React.FC = () => {
  const game = useGame();
  const player = usePlayer();
  const combat = useCombat();
  const { attackTavernCard } = useGameActions();
  const playerActions = usePlayerActions();
  const uiActions = useUIActions();
  const [draggedCard, setDraggedCard] = useState<any>(null);
  const [requestQueue, setRequestQueue] = useState<Promise<any>>(Promise.resolve());

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

  const handleEquipCard = async (card: any, slot: string) => {
    const cardId = card.card_id || card.cardId || (typeof card.id === 'number' ? card.id : parseInt(card.id.split('_').pop() || '0'));

    playerActions.equipCard(slot as any, card);
    uiActions.addNotification({
      type: 'success',
      message: `${card.name} equipped to ${slot} slot`,
      duration: 3000,
    });

    const retryRequest = async (attempt = 0): Promise<any> => {
      const maxRetries = 3;
      try {
        return await apiClient.post(API_ENDPOINTS.GAMES.EQUIP(game.gameId!), {
          cardId: cardId,
          slot: slot,
        });
      } catch (error: any) {
        if (attempt < maxRetries && error?.response?.status === 500) {
          const delay = Math.pow(2, attempt) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          return retryRequest(attempt + 1);
        }
        throw error;
      }
    };

    setRequestQueue(prevQueue =>
      prevQueue.then(() =>
        retryRequest().catch((error) => {
          logger.error('Failed to equip card after retries:', error);
          playerActions.unequipCard(slot as any);
          uiActions.addNotification({
            type: 'error',
            message: 'Failed to equip card - connection issue',
            duration: 3000,
          });
        })
      )
    );
  };

  const handleUnequipCard = async (slot: string) => {
    const card = (player.equippedCards as any)[slot];
    if (!card) return;

    const cardId = card.card_id || card.cardId || (typeof card.id === 'number' ? card.id : parseInt(card.id.split('_').pop() || '0'));

    playerActions.unequipCard(slot as any);
    uiActions.addNotification({
      type: 'info',
      message: `${card.name} unequipped from ${slot} slot`,
      duration: 3000,
    });

    const retryRequest = async (attempt = 0): Promise<any> => {
      const maxRetries = 3;
      try {
        return await apiClient.post(API_ENDPOINTS.GAMES.UNEQUIP(game.gameId!), {
          cardId: cardId,
        });
      } catch (error: any) {
        if (attempt < maxRetries && error?.response?.status === 500) {
          const delay = Math.pow(2, attempt) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          return retryRequest(attempt + 1);
        }
        throw error;
      }
    };

    setRequestQueue(prevQueue =>
      prevQueue.then(() =>
        retryRequest().catch((error) => {
          logger.error('Failed to unequip card after retries:', error);
          playerActions.equipCard(slot as any, card);
          uiActions.addNotification({
            type: 'error',
            message: 'Failed to unequip card - connection issue',
            duration: 3000,
          });
        })
      )
    );
  };

  const selectedCard = game.tavernCards.find(card => String(card.id) === selectedTarget);

  return (
    <div className="flex-1 w-full bg-gray-900 flex flex-col overflow-hidden">
      {/* Processing overlay */}
      {combat.isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-gray-900 px-6 py-4 rounded-lg border-2 border-tavern-gold shadow-xl">
            <Spinner size="lg" variant="inline" message="Processing combat..." />
          </div>
        </div>
      )}

      {/* Target panel - compact */}
      {selectedCard && (
        <div className="bg-yellow-900 bg-opacity-50 border-b-2 border-yellow-400 px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-yellow-400 font-bold">🎯</span>
            <span className="text-white font-semibold">{selectedCard.name}</span>
            <span className="text-red-400">❤️ {selectedCard.current_hp}</span>
            <span className="text-blue-400">🛡️ {selectedCard.current_shield}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAttack}
              disabled={combat.isProcessing}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded text-xs font-bold"
            >
              ⚔️ Attack
            </button>
            <button
              onClick={clearTarget}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Main content - auto-sized */}
      <div className="flex-1 flex gap-2 p-2 min-h-0 overflow-hidden">
        {/* Tavern cards - 2 columns */}
        <div className="flex-1 bg-gray-800 rounded-lg p-3 border-2 border-gray-700 flex flex-col">
          <h2 className="text-sm font-bold text-tavern-gold mb-2">Tavern Cards</h2>
          <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto content-start">
            {game.tavernCards.map((card) => (
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
            ))}
          </div>
        </div>

        {/* Equipment - fixed width */}
        <div className="w-48 bg-gray-800 rounded-lg p-3 border-2 border-gray-700 flex flex-col">
          <h2 className="text-sm font-bold text-tavern-gold mb-2">Equipment</h2>
          <div className="flex-1 flex flex-col gap-2">
            {['hp', 'shield', 'normal', 'special', 'passive'].map((slot) => {
              const card = player.equippedCards[slot as keyof typeof player.equippedCards];
              const slotIcons = { hp: '❤️', shield: '🛡️', normal: '💥', special: '⚡', passive: '⏫' };
              const slotColors = { hp: 'border-red-500', shield: 'border-blue-500', normal: 'border-gray-500', special: 'border-yellow-500', passive: 'border-purple-500' };

              return (
                <div
                  key={slot}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const cardData = e.dataTransfer.getData('text/plain');
                    const droppedCard = cardData ? JSON.parse(cardData) : draggedCard;
                    if (droppedCard) {
                      handleEquipCard(droppedCard, slot);
                    }
                  }}
                  onClick={() => card && handleUnequipCard(slot)}
                  className={`bg-gray-900 rounded p-2 border-2 min-h-[60px] transition-all ${
                    draggedCard ? 'border-yellow-400 bg-yellow-900 bg-opacity-20' : slotColors[slot as keyof typeof slotColors]
                  } ${card ? 'cursor-pointer hover:bg-gray-800' : 'border-opacity-30'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-white uppercase">{slot}</span>
                    <span className="text-lg">{slotIcons[slot as keyof typeof slotIcons]}</span>
                  </div>
                  {card ? (
                    <div>
                      <p className="text-[10px] font-bold text-white truncate">{card.name}</p>
                      <p className="text-[9px] text-gray-400">Click to unequip</p>
                    </div>
                  ) : (
                    <p className="text-[9px] text-gray-500 text-center">{draggedCard ? 'Drop here' : 'Empty'}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hand - fixed height at bottom */}
      <div className="h-20 bg-gray-800 border-t-2 border-gray-700 px-3 py-2 flex flex-col">
        <h3 className="text-xs font-bold text-tavern-gold mb-1">Hand</h3>
        <div className="flex-1 flex gap-2 overflow-x-auto">
          {player.hand.map((card: any) => (
            <div
              key={card.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify(card));
                setDraggedCard(card);
              }}
              onDragEnd={() => setDraggedCard(null)}
              className="flex-shrink-0"
            >
              <HandCard card={card} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
