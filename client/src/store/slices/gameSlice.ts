import type { StateCreator } from 'zustand';
import type { Card, Boss } from '../../types';

export interface GameSlice {
  game: {
    gameId: string | null;
    phase: 'lobby' | 'tavern' | 'boss' | 'gameover';
    turn: number;
    tavernCards: Card[];
    bossData: Boss | null;
    gameSettings: {
      difficulty: 'easy' | 'normal' | 'hard';
      soundEnabled: boolean;
      musicEnabled: boolean;
    };
  };

  // Actions
  initializeGame: (gameId: string) => void;
  setPhase: (phase: GameSlice['game']['phase']) => void;
  incrementTurn: () => void;
  setTavernCards: (cards: Card[]) => void;
  removeTavernCard: (cardId: string) => void;
  setBoss: (boss: Boss) => void;
  updateBossHp: (hp: number) => void;
  endGame: (victory: boolean) => void;
  resetGame: () => void;
  updateSettings: (settings: Partial<GameSlice['game']['gameSettings']>) => void;
}

const initialGameState = {
  gameId: null,
  phase: 'lobby' as const,
  turn: 0,
  tavernCards: [] as Card[],
  bossData: null,
  gameSettings: {
    difficulty: 'normal' as const,
    soundEnabled: true,
    musicEnabled: true,
  },
};

export const createGameSlice: StateCreator<GameSlice> = (set) => ({
  game: initialGameState,

  initializeGame: (gameId) => set((state) => ({
    game: { ...state.game, gameId, phase: 'tavern', turn: 1 }
  })),

  setPhase: (phase) => set((state) => ({
    game: { ...state.game, phase }
  })),

  incrementTurn: () => set((state) => ({
    game: { ...state.game, turn: state.game.turn + 1 }
  })),

  setTavernCards: (cards) => set((state) => ({
    game: { ...state.game, tavernCards: cards }
  })),

  removeTavernCard: (cardId) => set((state) => ({
    game: {
      ...state.game,
      tavernCards: state.game.tavernCards.filter(c => c.id !== cardId),
    }
  })),

  setBoss: (boss) => set((state) => ({
    game: { ...state.game, bossData: boss }
  })),

  updateBossHp: (hp) => set((state) => ({
    game: {
      ...state.game,
      bossData: state.game.bossData ? { ...state.game.bossData, hp } : null,
    }
  })),

  endGame: (_victory) => set((state) => ({
    game: { ...state.game, phase: 'gameover' }
  })),

  resetGame: () => set({ game: initialGameState }),

  updateSettings: (settings) => set((state) => ({
    game: {
      ...state.game,
      gameSettings: { ...state.game.gameSettings, ...settings },
    }
  })),
});
