import type { StateCreator } from 'zustand';
import { SlotType } from '../../types';
import type { Card, Ability } from '../../types';

export interface PlayerSlice {
  player: {
    id: string;
    hp: number;
    maxHp: number;
    level: number;
    score: number;
    equippedCards: Record<SlotType, Card | null>;
    hand: Card[];
    slotLevels: Record<SlotType, number>;
    abilities: {
      normal: Ability | null;
      special: Ability | null;
    };
  };

  // Actions
  setPlayerId: (id: string) => void;
  setPlayerHp: (hp: number) => void;
  equipCard: (slot: SlotType, card: Card) => void;
  unequipCard: (slot: SlotType) => void;
  addToHand: (card: Card) => void;
  removeFromHand: (cardId: string) => void;
  upgradeSlot: (slot: SlotType) => void;
  setAbility: (type: 'normal' | 'special', ability: Ability) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  resetPlayer: () => void;
}

const initialPlayerState = {
  id: '',
  hp: 100,
  maxHp: 100,
  level: 1,
  score: 0,
  equippedCards: {
    [SlotType.HP]: null,
    [SlotType.SHIELD]: null,
    [SlotType.SPECIAL]: null,
    [SlotType.PASSIVE]: null,
    [SlotType.NORMAL]: null,
  },
  hand: [] as Card[],
  slotLevels: {
    [SlotType.HP]: 1,
    [SlotType.SHIELD]: 1,
    [SlotType.SPECIAL]: 1,
    [SlotType.PASSIVE]: 1,
    [SlotType.NORMAL]: 1,
  },
  abilities: {
    normal: null,
    special: null,
  },
};

export const createPlayerSlice: StateCreator<PlayerSlice> = (set) => ({
  player: initialPlayerState,

  setPlayerId: (id) => set((state) => ({
    player: { ...state.player, id }
  })),

  setPlayerHp: (hp) => set((state) => ({
    player: { ...state.player, hp: Math.max(0, Math.min(hp, state.player.maxHp)) }
  })),

  equipCard: (slot, card) => set((state) => ({
    player: {
      ...state.player,
      equippedCards: { ...state.player.equippedCards, [slot]: card },
      hand: state.player.hand.filter(c => c.id !== card.id),
    }
  })),

  unequipCard: (slot) => set((state) => {
    const card = state.player.equippedCards[slot];
    if (!card) return state;

    return {
      player: {
        ...state.player,
        equippedCards: { ...state.player.equippedCards, [slot]: null },
        hand: [...state.player.hand, card],
      }
    };
  }),

  addToHand: (card) => set((state) => ({
    player: {
      ...state.player,
      hand: [...state.player.hand, card],
    }
  })),

  removeFromHand: (cardId) => set((state) => ({
    player: {
      ...state.player,
      hand: state.player.hand.filter(c => c.id !== cardId),
    }
  })),

  upgradeSlot: (slot) => set((state) => ({
    player: {
      ...state.player,
      slotLevels: {
        ...state.player.slotLevels,
        [slot]: state.player.slotLevels[slot] + 1,
      },
    }
  })),

  setAbility: (type, ability) => set((state) => ({
    player: {
      ...state.player,
      abilities: { ...state.player.abilities, [type]: ability },
    }
  })),

  takeDamage: (amount) => set((state) => ({
    player: {
      ...state.player,
      hp: Math.max(0, state.player.hp - amount),
    }
  })),

  heal: (amount) => set((state) => ({
    player: {
      ...state.player,
      hp: Math.min(state.player.maxHp, state.player.hp + amount),
    }
  })),

  resetPlayer: () => set({ player: initialPlayerState }),
});
