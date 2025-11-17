import type { StateCreator } from 'zustand';
import { SlotType } from '../../types';
import type { Card, Ability } from '../../types';

// HP Dynamics: Player HP is now tied to equipped HP card

export interface PlayerSlice {
  player: {
    id: string;
    hp: number;
    maxHp: number;
    baseHp: number;
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
  setMaxHp: (maxHp: number) => void;
  equipCard: (slot: SlotType, card: Card) => void;
  unequipCard: (slot: SlotType) => void;
  addToHand: (card: Card) => void;
  removeFromHand: (cardId: string) => void;
  setHand: (cards: Card[]) => void;
  upgradeSlot: (slot: SlotType) => void;
  setAbility: (type: 'normal' | 'special', ability: Ability) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  resetPlayer: () => void;
}

const BASE_HP = 100;

const initialPlayerState = {
  id: '',
  hp: BASE_HP,
  maxHp: BASE_HP,
  baseHp: BASE_HP,
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

  setMaxHp: (maxHp) => set((state) => ({
    player: {
      ...state.player,
      maxHp,
      hp: Math.min(state.player.hp, maxHp) // Adjust current HP if it exceeds new max
    }
  })),

  equipCard: (slot, card) => set((state) => {
    // Check if there's already a card in this slot
    const previousCard = state.player.equippedCards[slot];

    // Calculate new maxHp if HP card is being equipped
    let newMaxHp = state.player.maxHp;
    let newHp = state.player.hp;

    if (slot === SlotType.HP && card.stats?.hp) {
      // HP is ONLY the card's HP, not base + card HP
      newMaxHp = card.stats.hp;
      // Don't auto-heal when replacing, only when equipping to empty slot
      if (!previousCard) {
        newHp = newMaxHp;
      } else {
        // Clamp current HP to new max
        newHp = Math.min(state.player.hp, newMaxHp);
      }
    }

    // Build new hand: remove the card being equipped, add the previous card if any
    let newHand = state.player.hand.filter(c => c.id !== card.id);
    if (previousCard) {
      newHand = [...newHand, previousCard];
    }

    return {
      player: {
        ...state.player,
        maxHp: newMaxHp,
        hp: newHp,
        equippedCards: { ...state.player.equippedCards, [slot]: card },
        hand: newHand,
      }
    };
  }),

  unequipCard: (slot) => set((state) => {
    const card = state.player.equippedCards[slot];
    if (!card) return state;

    // Calculate new maxHp if HP card is being unequipped
    let newMaxHp = state.player.maxHp;
    let newHp = state.player.hp;

    if (slot === SlotType.HP && card.stats?.hp) {
      // When unequipping HP card, HP becomes 0 (no base HP)
      newMaxHp = 0;
      newHp = 0;
    }

    return {
      player: {
        ...state.player,
        maxHp: newMaxHp,
        hp: newHp,
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

  setHand: (cards) => set((state) => ({
    player: {
      ...state.player,
      hand: cards,
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
