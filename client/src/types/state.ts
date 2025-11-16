import { SlotType } from './card';
import type { Card, Ability, Boss } from './card';

export interface PlayerState {
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
}

export interface GameState {
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
}

export interface CombatEntry {
  id: string;
  type: 'damage' | 'heal' | 'ability' | 'boss_attack' | 'card_equipped' | 'card_destroyed' | 'attack';
  timestamp: number;
  source?: string;
  target?: string;
  amount?: number;
  message?: string;
}

export interface Animation {
  id: string;
  type: 'attack' | 'damage' | 'heal' | 'equip' | 'discard' | 'death';
  sourceId?: string;
  targetId?: string;
  duration: number;
  play: () => Promise<void>;
}

export interface DamageEvent {
  id: string;
  source: string;
  target: string;
  amount: number;
  position: { x: number; y: number };
  critical?: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface TooltipData {
  content: React.ReactNode;
  position: { x: number; y: number };
}

export interface GameStateUpdate {
  phase: 'lobby' | 'tavern' | 'boss' | 'gameover';
  turn: number;
  playerData?: Partial<PlayerState>;
  tavernData?: Card[];
}

export interface CombatState {
  combatLog: CombatEntry[];
  activeAnimations: Animation[];
  damageQueue: DamageEvent[];
  isProcessing: boolean;
  selectedTarget: string | null;
  abilityOnCooldown: {
    normal: boolean;
    special: boolean;
  };
}

export interface UIState {
  selectedCard: Card | null;
  hoveredCard: Card | null;
  draggedCard: Card | null;
  modals: {
    slotUpgrade: boolean;
    gameOver: boolean;
    settings: boolean;
  };
  notifications: Notification[];
  isLoading: boolean;
  tooltipData: TooltipData | null;
}
