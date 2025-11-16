import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { createPlayerSlice, type PlayerSlice } from './slices/playerSlice';
import { createGameSlice, type GameSlice } from './slices/gameSlice';
import { createCombatSlice, type CombatSlice } from './slices/combatSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';

type GameStore = PlayerSlice & GameSlice & CombatSlice & UISlice;

export const useGameStore = create<GameStore>()(
  devtools(
    (...args) => ({
      ...createPlayerSlice(...args),
      ...createGameSlice(...args),
      ...createCombatSlice(...args),
      ...createUISlice(...args),
    }),
    { name: 'TavernGameStore' }
  )
);

// Selector hooks for better performance - using shallow comparison
export const usePlayer = () => useGameStore(useShallow((state) => state.player));
export const useGame = () => useGameStore(useShallow((state) => state.game));
export const useCombat = () => useGameStore(useShallow((state) => state.combat));
export const useUI = () => useGameStore(useShallow((state) => state.ui));

// Optimized action hooks with stable references
const playerActionsSelector = (state: GameStore) => ({
  setPlayerId: state.setPlayerId,
  setPlayerHp: state.setPlayerHp,
  equipCard: state.equipCard,
  unequipCard: state.unequipCard,
  addToHand: state.addToHand,
  removeFromHand: state.removeFromHand,
  upgradeSlot: state.upgradeSlot,
  setAbility: state.setAbility,
  takeDamage: state.takeDamage,
  heal: state.heal,
  resetPlayer: state.resetPlayer,
});

const gameActionsSelector = (state: GameStore) => ({
  initializeGame: state.initializeGame,
  setPhase: state.setPhase,
  incrementTurn: state.incrementTurn,
  setTavernCards: state.setTavernCards,
  removeTavernCard: state.removeTavernCard,
  setBoss: state.setBoss,
  updateBossHp: state.updateBossHp,
  endGame: state.endGame,
  resetGame: state.resetGame,
  updateSettings: state.updateSettings,
});

const combatActionsSelector = (state: GameStore) => ({
  addCombatEntry: state.addCombatEntry,
  clearCombatLog: state.clearCombatLog,
  queueAnimation: state.queueAnimation,
  removeAnimation: state.removeAnimation,
  queueDamage: state.queueDamage,
  processDamageQueue: state.processDamageQueue,
  setProcessing: state.setProcessing,
  selectTarget: state.selectTarget,
  setCooldown: state.setCooldown,
});

const uiActionsSelector = (state: GameStore) => ({
  selectCard: state.selectCard,
  setHoveredCard: state.setHoveredCard,
  setDraggedCard: state.setDraggedCard,
  openModal: state.openModal,
  closeModal: state.closeModal,
  addNotification: state.addNotification,
  removeNotification: state.removeNotification,
  setLoading: state.setLoading,
  setTooltip: state.setTooltip,
});

export const usePlayerActions = () => useGameStore(useShallow(playerActionsSelector));
export const useGameActions = () => useGameStore(useShallow(gameActionsSelector));
export const useCombatActions = () => useGameStore(useShallow(combatActionsSelector));
export const useUIActions = () => useGameStore(useShallow(uiActionsSelector));
