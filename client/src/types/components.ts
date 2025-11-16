import type { Card, Ability, Boss } from './card';
import { SlotType } from './card';
import type { CombatEntry } from './state';

export interface CardProps {
  card: Card;
  onClick?: (card: Card) => void;
  onDragStart?: (card: Card) => void;
  onDragEnd?: () => void;
  draggable?: boolean;
  className?: string;
  showTooltip?: boolean;
  variant?: 'tavern' | 'hand' | 'equipped';
}

export interface EquipmentSlotProps {
  type: SlotType;
  equippedCard: Card | null;
  level: number;
  onDrop: (card: Card) => void;
  onRemove?: () => void;
}

export interface TavernCardProps extends CardProps {
  onAttack: (cardId: string) => void;
  isTargeted?: boolean;
  canAttack?: boolean;
}

export interface CombatLogProps {
  entries: CombatEntry[];
  maxEntries?: number;
  autoScroll?: boolean;
}

export interface AbilityButtonProps {
  ability: Ability;
  type: 'normal' | 'special';
  onUse: () => void;
  disabled?: boolean;
  cooldownRemaining?: number;
}

export interface PlayerStatsProps {
  hp: number;
  maxHp: number;
  level: number;
  score: number;
  compact?: boolean;
}

export interface BossDisplayProps {
  boss: Boss;
  showHealthBar?: boolean;
  animated?: boolean;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ProgressBarProps {
  current: number;
  max: number;
  color?: string;
  showLabel?: boolean;
  className?: string;
}
