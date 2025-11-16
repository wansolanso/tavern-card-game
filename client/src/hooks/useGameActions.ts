import { useCallback } from 'react';
import { useSocket } from '../providers/SocketProvider';
import { useGameStore } from '../store';
import { SOCKET_EVENTS } from '../types/websocket';
import { SlotType } from '../types';
import { logger } from '../utils/logger';

export const useGameActions = () => {
  const { emit } = useSocket();
  const gameId = useGameStore((state) => state.game.gameId);
  const tavernCards = useGameStore((state) => state.game.tavern);
  const isProcessing = useGameStore((state) => state.combat.isProcessing);
  const setProcessing = useGameStore((state) => state.setProcessing);

  const attackTavernCard = useCallback((targetCardId: string) => {
    // Check if already processing
    if (isProcessing) {
      logger.warn('Cannot attack: Action already in progress');
      return;
    }

    // Validate gameId
    if (!gameId) {
      logger.error('Cannot attack tavern card: No active game');
      return;
    }

    // Validate targetCardId
    if (!targetCardId || typeof targetCardId !== 'string' || targetCardId.trim() === '') {
      logger.error('Cannot attack tavern card: Invalid target card ID');
      return;
    }

    // Validate card exists in tavern
    const targetExists = tavernCards.some(card => String(card.id) === targetCardId);
    if (!targetExists) {
      logger.warn(`Cannot attack tavern card: Card ${targetCardId} not found in tavern`);
      return;
    }

    // Set processing state before emitting
    setProcessing(true);
    logger.debug(`Attacking tavern card ${targetCardId} in game ${gameId}`);
    emit('attack', { gameId, targetCardId });
  }, [emit, gameId, tavernCards, isProcessing, setProcessing]);

  const equipCard = useCallback((cardId: string, slot: SlotType) => {
    emit(SOCKET_EVENTS.EQUIP_CARD, { cardId, slot });
  }, [emit]);

  const discardCard = useCallback((cardId: string, targetSlot: SlotType) => {
    emit(SOCKET_EVENTS.DISCARD_CARD, { cardId, targetSlot });
  }, [emit]);

  const upgradeSlot = useCallback((slot: SlotType) => {
    emit(SOCKET_EVENTS.UPGRADE_SLOT, { slot });
  }, [emit]);

  const useAbility = useCallback((type: 'normal' | 'special', targetId?: string) => {
    emit(SOCKET_EVENTS.USE_ABILITY, { type, targetId });
  }, [emit]);

  const readyForBoss = useCallback(() => {
    emit(SOCKET_EVENTS.READY_BOSS, {});
  }, [emit]);

  return {
    attackTavernCard,
    equipCard,
    discardCard,
    upgradeSlot,
    useAbility,
    readyForBoss,
  };
};
