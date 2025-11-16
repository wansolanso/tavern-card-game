import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createGameSlice, type GameSlice } from '../slices/gameSlice';
import type { Card, Boss } from '../../types';

describe('GameSlice', () => {
  let store: ReturnType<typeof create<GameSlice>>;

  beforeEach(() => {
    store = create<GameSlice>(createGameSlice);
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const state = store.getState();

      expect(state.game.gameId).toBeNull();
      expect(state.game.phase).toBe('lobby');
      expect(state.game.turn).toBe(0);
      expect(state.game.tavernCards).toEqual([]);
      expect(state.game.bossData).toBeNull();
      expect(state.game.gameSettings).toEqual({
        difficulty: 'normal',
        soundEnabled: true,
        musicEnabled: true,
      });
    });
  });

  describe('initializeGame', () => {
    it('should initialize game with ID and set phase to tavern', () => {
      const gameId = 'game-123';
      store.getState().initializeGame(gameId);

      const state = store.getState();
      expect(state.game.gameId).toBe(gameId);
      expect(state.game.phase).toBe('tavern');
      expect(state.game.turn).toBe(1);
    });

    it('should preserve existing settings when initializing', () => {
      store.getState().updateSettings({ soundEnabled: false });
      store.getState().initializeGame('game-456');

      const state = store.getState();
      expect(state.game.gameSettings.soundEnabled).toBe(false);
    });
  });

  describe('setPhase', () => {
    it('should update game phase correctly', () => {
      store.getState().setPhase('tavern');
      expect(store.getState().game.phase).toBe('tavern');

      store.getState().setPhase('boss');
      expect(store.getState().game.phase).toBe('boss');

      store.getState().setPhase('gameover');
      expect(store.getState().game.phase).toBe('gameover');

      store.getState().setPhase('lobby');
      expect(store.getState().game.phase).toBe('lobby');
    });

    it('should not affect other game state when updating phase', () => {
      store.getState().initializeGame('game-123');
      const turnBefore = store.getState().game.turn;

      store.getState().setPhase('boss');

      expect(store.getState().game.turn).toBe(turnBefore);
      expect(store.getState().game.gameId).toBe('game-123');
    });
  });

  describe('incrementTurn', () => {
    it('should increment turn by 1', () => {
      expect(store.getState().game.turn).toBe(0);

      store.getState().incrementTurn();
      expect(store.getState().game.turn).toBe(1);

      store.getState().incrementTurn();
      expect(store.getState().game.turn).toBe(2);
    });

    it('should handle multiple increments', () => {
      for (let i = 0; i < 10; i++) {
        store.getState().incrementTurn();
      }

      expect(store.getState().game.turn).toBe(10);
    });
  });

  describe('setTavernCards', () => {
    it('should set tavern cards', () => {
      const cards: Card[] = [
        { id: '1', name: 'Card 1', type: 'character', rarity: 'common', hp: 10, shield: 5, abilities: [] },
        { id: '2', name: 'Card 2', type: 'character', rarity: 'rare', hp: 15, shield: 8, abilities: [] },
      ];

      store.getState().setTavernCards(cards);

      expect(store.getState().game.tavernCards).toEqual(cards);
      expect(store.getState().game.tavernCards).toHaveLength(2);
    });

    it('should replace existing cards', () => {
      const cards1: Card[] = [
        { id: '1', name: 'Card 1', type: 'character', rarity: 'common', hp: 10, shield: 5, abilities: [] },
      ];

      const cards2: Card[] = [
        { id: '2', name: 'Card 2', type: 'character', rarity: 'rare', hp: 15, shield: 8, abilities: [] },
        { id: '3', name: 'Card 3', type: 'character', rarity: 'epic', hp: 20, shield: 10, abilities: [] },
      ];

      store.getState().setTavernCards(cards1);
      expect(store.getState().game.tavernCards).toHaveLength(1);

      store.getState().setTavernCards(cards2);
      expect(store.getState().game.tavernCards).toHaveLength(2);
      expect(store.getState().game.tavernCards[0].id).toBe('2');
    });

    it('should accept empty array', () => {
      store.getState().setTavernCards([]);
      expect(store.getState().game.tavernCards).toEqual([]);
    });
  });

  describe('removeTavernCard', () => {
    it('should remove card by ID', () => {
      const cards: Card[] = [
        { id: '1', name: 'Card 1', type: 'character', rarity: 'common', hp: 10, shield: 5, abilities: [] },
        { id: '2', name: 'Card 2', type: 'character', rarity: 'rare', hp: 15, shield: 8, abilities: [] },
        { id: '3', name: 'Card 3', type: 'character', rarity: 'epic', hp: 20, shield: 10, abilities: [] },
      ];

      store.getState().setTavernCards(cards);
      store.getState().removeTavernCard('2');

      const remainingCards = store.getState().game.tavernCards;
      expect(remainingCards).toHaveLength(2);
      expect(remainingCards.find(c => c.id === '2')).toBeUndefined();
      expect(remainingCards.find(c => c.id === '1')).toBeDefined();
      expect(remainingCards.find(c => c.id === '3')).toBeDefined();
    });

    it('should do nothing if card ID not found', () => {
      const cards: Card[] = [
        { id: '1', name: 'Card 1', type: 'character', rarity: 'common', hp: 10, shield: 5, abilities: [] },
      ];

      store.getState().setTavernCards(cards);
      store.getState().removeTavernCard('999');

      expect(store.getState().game.tavernCards).toHaveLength(1);
    });
  });

  describe('setBoss', () => {
    it('should set boss data', () => {
      const boss: Boss = {
        id: 'boss-1',
        name: 'Dragon King',
        hp: 100,
        maxHp: 100,
        abilities: [],
      };

      store.getState().setBoss(boss);

      expect(store.getState().game.bossData).toEqual(boss);
    });

    it('should replace existing boss', () => {
      const boss1: Boss = {
        id: 'boss-1',
        name: 'Dragon King',
        hp: 100,
        maxHp: 100,
        abilities: [],
      };

      const boss2: Boss = {
        id: 'boss-2',
        name: 'Demon Lord',
        hp: 150,
        maxHp: 150,
        abilities: [],
      };

      store.getState().setBoss(boss1);
      expect(store.getState().game.bossData?.id).toBe('boss-1');

      store.getState().setBoss(boss2);
      expect(store.getState().game.bossData?.id).toBe('boss-2');
    });
  });

  describe('updateBossHp', () => {
    it('should update boss HP if boss exists', () => {
      const boss: Boss = {
        id: 'boss-1',
        name: 'Dragon King',
        hp: 100,
        maxHp: 100,
        abilities: [],
      };

      store.getState().setBoss(boss);
      store.getState().updateBossHp(75);

      expect(store.getState().game.bossData?.hp).toBe(75);
      expect(store.getState().game.bossData?.maxHp).toBe(100);
    });

    it('should handle HP reaching 0', () => {
      const boss: Boss = {
        id: 'boss-1',
        name: 'Dragon King',
        hp: 100,
        maxHp: 100,
        abilities: [],
      };

      store.getState().setBoss(boss);
      store.getState().updateBossHp(0);

      expect(store.getState().game.bossData?.hp).toBe(0);
    });

    it('should do nothing if no boss exists', () => {
      store.getState().updateBossHp(50);

      expect(store.getState().game.bossData).toBeNull();
    });
  });

  describe('endGame', () => {
    it('should set phase to gameover on victory', () => {
      store.getState().initializeGame('game-123');
      store.getState().endGame(true);

      expect(store.getState().game.phase).toBe('gameover');
    });

    it('should set phase to gameover on defeat', () => {
      store.getState().initializeGame('game-123');
      store.getState().endGame(false);

      expect(store.getState().game.phase).toBe('gameover');
    });
  });

  describe('resetGame', () => {
    it('should reset all game state to initial values', () => {
      const cards: Card[] = [
        { id: '1', name: 'Card 1', type: 'character', rarity: 'common', hp: 10, shield: 5, abilities: [] },
      ];

      const boss: Boss = {
        id: 'boss-1',
        name: 'Dragon King',
        hp: 100,
        maxHp: 100,
        abilities: [],
      };

      store.getState().initializeGame('game-123');
      store.getState().setTavernCards(cards);
      store.getState().setBoss(boss);
      store.getState().incrementTurn();
      store.getState().setPhase('boss');

      store.getState().resetGame();

      const state = store.getState();
      expect(state.game.gameId).toBeNull();
      expect(state.game.phase).toBe('lobby');
      expect(state.game.turn).toBe(0);
      expect(state.game.tavernCards).toEqual([]);
      expect(state.game.bossData).toBeNull();
    });
  });

  describe('updateSettings', () => {
    it('should update individual settings', () => {
      store.getState().updateSettings({ soundEnabled: false });
      expect(store.getState().game.gameSettings.soundEnabled).toBe(false);
      expect(store.getState().game.gameSettings.musicEnabled).toBe(true);

      store.getState().updateSettings({ musicEnabled: false });
      expect(store.getState().game.gameSettings.musicEnabled).toBe(false);
    });

    it('should update multiple settings at once', () => {
      store.getState().updateSettings({
        soundEnabled: false,
        musicEnabled: false,
        difficulty: 'hard',
      });

      const settings = store.getState().game.gameSettings;
      expect(settings.soundEnabled).toBe(false);
      expect(settings.musicEnabled).toBe(false);
      expect(settings.difficulty).toBe('hard');
    });

    it('should preserve unmodified settings', () => {
      store.getState().updateSettings({ difficulty: 'easy' });

      const settings = store.getState().game.gameSettings;
      expect(settings.difficulty).toBe('easy');
      expect(settings.soundEnabled).toBe(true);
      expect(settings.musicEnabled).toBe(true);
    });
  });
});
