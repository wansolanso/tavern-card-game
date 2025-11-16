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
      console.log('Game state update:', data);
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

    // Tavern updates
    socket.on(SOCKET_EVENTS.TAVERN_UPDATE, (data: { cards: Card[] }) => {
      console.log('Tavern update:', data);
      gameActions.setTavernCards(data.cards);
    });

    // Card equipped
    socket.on(SOCKET_EVENTS.CARD_EQUIPPED, (data: { card: Card; slot: string }) => {
      console.log('Card equipped:', data);
      combatActions.addCombatEntry({
        type: 'card_equipped',
        message: `Equipped ${data.card.name} to ${data.slot} slot`,
      });
    });

    // Combat events
    socket.on(SOCKET_EVENTS.DAMAGE_DEALT, (data: DamageEvent) => {
      console.log('Damage dealt:', data);
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
      console.log('Boss spawned:', data);
      gameActions.setBoss(data);
      gameActions.setPhase('boss');
      combatActions.addCombatEntry({
        type: 'boss_attack',
        message: `${data.name} has appeared!`,
      });
    });

    socket.on(SOCKET_EVENTS.BOSS_ATTACK, (data: { ability: string; damage: number }) => {
      console.log('Boss attack:', data);
      playerActions.takeDamage(data.damage);
      combatActions.addCombatEntry({
        type: 'boss_attack',
        amount: data.damage,
        message: `Boss used ${data.ability} and dealt ${data.damage} damage!`,
      });
    });

    // Game over
    socket.on(SOCKET_EVENTS.GAME_OVER, (data: { victory: boolean; score: number }) => {
      console.log('Game over:', data);
      gameActions.endGame(data.victory);
      uiActions.addNotification({
        type: data.victory ? 'success' : 'error',
        message: data.victory ? 'Victory!' : 'Defeat!',
        duration: 10000,
      });
    });

    // Error handling
    socket.on(SOCKET_EVENTS.ERROR, (error: { message: string; code?: string }) => {
      console.error('Socket error:', error);
      uiActions.addNotification({
        type: 'error',
        message: error.message,
        duration: 5000,
      });
    });

    return () => {
      socket.off(SOCKET_EVENTS.GAME_STATE_UPDATE);
      socket.off(SOCKET_EVENTS.TAVERN_UPDATE);
      socket.off(SOCKET_EVENTS.CARD_EQUIPPED);
      socket.off(SOCKET_EVENTS.DAMAGE_DEALT);
      socket.off(SOCKET_EVENTS.BOSS_SPAWNED);
      socket.off(SOCKET_EVENTS.BOSS_ATTACK);
      socket.off(SOCKET_EVENTS.GAME_OVER);
      socket.off(SOCKET_EVENTS.ERROR);
    };
  }, [socket, gameActions, playerActions, combatActions, uiActions]);
};
