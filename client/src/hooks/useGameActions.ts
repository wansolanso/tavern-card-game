import { useCallback } from 'react';
import { useSocket } from '../providers/SocketProvider';
import { SOCKET_EVENTS } from '../types/websocket';
import { SlotType } from '../types';

export const useGameActions = () => {
  const { emit } = useSocket();

  const attackTavernCard = useCallback((cardId: string) => {
    emit(SOCKET_EVENTS.ATTACK_TAVERN, { cardId });
  }, [emit]);

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
