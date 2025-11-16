import type { StateCreator } from 'zustand';
import type { CombatEntry, Animation, DamageEvent } from '../../types';

export interface CombatSlice {
  combat: {
    combatLog: CombatEntry[];
    activeAnimations: Animation[];
    damageQueue: DamageEvent[];
    isProcessing: boolean;
    selectedTarget: string | null;
    abilityOnCooldown: {
      normal: boolean;
      special: boolean;
    };
  };

  // Actions
  addCombatEntry: (entry: Omit<CombatEntry, 'id' | 'timestamp'>) => void;
  clearCombatLog: () => void;
  queueAnimation: (animation: Animation) => void;
  removeAnimation: (id: string) => void;
  queueDamage: (event: DamageEvent) => void;
  processDamageQueue: () => void;
  setProcessing: (processing: boolean) => void;
  selectTarget: (targetId: string | null) => void;
  setCooldown: (type: 'normal' | 'special', value: boolean) => void;
}

const initialCombatState = {
  combatLog: [] as CombatEntry[],
  activeAnimations: [] as Animation[],
  damageQueue: [] as DamageEvent[],
  isProcessing: false,
  selectedTarget: null,
  abilityOnCooldown: {
    normal: false,
    special: false,
  },
};

export const createCombatSlice: StateCreator<CombatSlice> = (set) => ({
  combat: initialCombatState,

  addCombatEntry: (entry) => set((state) => ({
    combat: {
      ...state.combat,
      combatLog: [
        ...state.combat.combatLog,
        {
          ...entry,
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
        },
      ].slice(-50), // Keep only last 50 entries
    }
  })),

  clearCombatLog: () => set((state) => ({
    combat: { ...state.combat, combatLog: [] }
  })),

  queueAnimation: (animation) => set((state) => ({
    combat: {
      ...state.combat,
      activeAnimations: [...state.combat.activeAnimations, animation],
    }
  })),

  removeAnimation: (id) => set((state) => ({
    combat: {
      ...state.combat,
      activeAnimations: state.combat.activeAnimations.filter(a => a.id !== id),
    }
  })),

  queueDamage: (event) => set((state) => ({
    combat: {
      ...state.combat,
      damageQueue: [...state.combat.damageQueue, event],
    }
  })),

  processDamageQueue: () => set((state) => ({
    combat: { ...state.combat, damageQueue: [] }
  })),

  setProcessing: (processing) => set((state) => ({
    combat: { ...state.combat, isProcessing: processing }
  })),

  selectTarget: (targetId) => set((state) => ({
    combat: { ...state.combat, selectedTarget: targetId }
  })),

  setCooldown: (type, value) => set((state) => ({
    combat: {
      ...state.combat,
      abilityOnCooldown: { ...state.combat.abilityOnCooldown, [type]: value },
    }
  })),
});
