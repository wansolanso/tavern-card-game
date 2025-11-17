import { useEffect } from 'react';
import { useSocket } from '../providers/SocketProvider';
import {
  useGameActions,
  usePlayerActions,
  useCombatActions,
  useUIActions
} from '../store';
import { SOCKET_EVENTS } from '../types/websocket';
import type { GameStateUpdate, DamageEvent } from '../types';
import type { Boss, Card } from '../types';
import type { CombatResultPayload, GameUpdatedPayload, CombatLogEntry } from '../types/socket';
import { logger } from '../utils/logger';
import { parseBackendError, formatErrorForNotification } from '../utils/errorHandler';

export const useSocketHandlers = () => {
  const { socket } = useSocket();

  // Get individual action functions instead of entire store
  // These are stable references from Zustand selectors
  const gameActions = useGameActions();
  const playerActions = usePlayerActions();
  const combatActions = useCombatActions();
  const uiActions = useUIActions();

  useEffect(() => {
    if (!socket) return;

    // Game state updates
    socket.on(SOCKET_EVENTS.GAME_STATE_UPDATE, (data: GameStateUpdate) => {
      logger.debug('Game state update:', data);
      gameActions.setPhase(data.phase);
      if (data.turn) {
        gameActions.incrementTurn();
      }
      if (data.playerData) {
        if (data.playerData.hp !== undefined) {
          playerActions.setPlayerHp(data.playerData.hp);
        }
      }
    });

    // Card equipped
    socket.on(SOCKET_EVENTS.CARD_EQUIPPED, (data: { card: Card; slot: string }) => {
      logger.debug('Card equipped:', data);
      combatActions.addCombatEntry({
        type: 'card_equipped',
        message: `Equipped ${data.card.name} to ${data.slot} slot`,
      });
    });

    // Combat events
    socket.on(SOCKET_EVENTS.DAMAGE_DEALT, (data: DamageEvent) => {
      logger.debug('Damage dealt:', data);
      combatActions.queueDamage(data);
      combatActions.addCombatEntry({
        type: 'damage',
        source: data.source,
        target: data.target,
        amount: data.amount,
      });
    });

    // Boss events
    socket.on(SOCKET_EVENTS.BOSS_SPAWNED, (data: Boss) => {
      logger.debug('Boss spawned:', data);
      gameActions.setBoss(data);
      gameActions.setPhase('boss');
      combatActions.addCombatEntry({
        type: 'boss_attack',
        message: `${data.name} has appeared!`,
      });
    });

    socket.on(SOCKET_EVENTS.BOSS_ATTACK, (data: { ability: string; damage: number }) => {
      logger.debug('Boss attack:', data);
      playerActions.takeDamage(data.damage);
      combatActions.addCombatEntry({
        type: 'boss_attack',
        amount: data.damage,
        message: `Boss used ${data.ability} and dealt ${data.damage} damage!`,
      });
    });

    // Game over
    socket.on(SOCKET_EVENTS.GAME_OVER, (data: { victory: boolean; score: number }) => {
      logger.debug('Game over:', data);
      gameActions.endGame(data.victory);
      uiActions.addNotification({
        type: data.victory ? 'success' : 'error',
        message: data.victory ? 'Victory!' : 'Defeat!',
        duration: 10000,
      });
    });

    // Combat result (from attack)
    socket.on('combat_result', (data: CombatResultPayload) => {
      logger.debug('Combat result:', data);

      // Clear processing state
      combatActions.setProcessing(false);

      // Update game state with the new game data
      if (data.game) {
        gameActions.setTavernCards(data.game.tavern || []);
        if (data.game.player_current_hp !== undefined) {
          playerActions.setPlayerHp(data.game.player_current_hp);
        }
      }

      // Add combat log entries
      if (data.combatLog && data.combatLog.length > 0) {
        data.combatLog.forEach((entry: CombatLogEntry) => {
          combatActions.addCombatEntry({
            type: entry.action as 'attack' | 'damage' | 'heal' | 'ability',
            message: entry.result,
            amount: entry.damage,
          });
        });
      }

      // Show notification for destroyed target
      if (data.targetDestroyed) {
        uiActions.addNotification({
          type: 'success',
          message: 'Target defeated!',
          duration: 3000,
        });
      }
    });

    // Game updated (from equip/unequip/etc)
    socket.on('game_updated', (data: GameUpdatedPayload) => {
      logger.debug('Game updated:', data);
      if (data.game) {
        gameActions.setTavernCards(data.game.tavern || []);
        if (data.game.player_current_hp !== undefined) {
          playerActions.setPlayerHp(data.game.player_current_hp);
        }
      }
    });

    // Error handling
    socket.on(SOCKET_EVENTS.ERROR, (error: { message: string; code?: string }) => {
      logger.error('Socket error:', error);

      // Clear any pending processing states on error
      combatActions.setProcessing(false);
      uiActions.clearAllLoadingStates();

      // Parse and format error for display
      const errorDef = parseBackendError(error);

      uiActions.addNotification({
        type: 'error',
        message: `${errorDef.message}. ${errorDef.action}`,
        duration: 6000,
      });
    });

    socket.on('error', (error: { message: string; code?: string }) => {
      logger.error('Socket error:', error);

      // Clear any pending processing states on error
      combatActions.setProcessing(false);
      uiActions.clearAllLoadingStates();

      // Parse and format error for display
      const errorDef = parseBackendError(error);

      uiActions.addNotification({
        type: 'error',
        message: `${errorDef.message}. ${errorDef.action}`,
        duration: 6000,
      });
    });

    return () => {
      socket.off(SOCKET_EVENTS.GAME_STATE_UPDATE);
      socket.off(SOCKET_EVENTS.CARD_EQUIPPED);
      socket.off(SOCKET_EVENTS.DAMAGE_DEALT);
      socket.off(SOCKET_EVENTS.BOSS_SPAWNED);
      socket.off(SOCKET_EVENTS.BOSS_ATTACK);
      socket.off(SOCKET_EVENTS.GAME_OVER);
      socket.off(SOCKET_EVENTS.ERROR);
      socket.off('combat_result');
      socket.off('game_updated');
      socket.off('error');
    };
  }, [socket, gameActions, playerActions, combatActions, uiActions]);
};
