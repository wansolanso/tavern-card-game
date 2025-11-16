export const CardRarity = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const;

export type CardRarity = (typeof CardRarity)[keyof typeof CardRarity];

export const SlotType = {
  HP: 'hp',
  SHIELD: 'shield',
  SPECIAL: 'special',
  PASSIVE: 'passive',
  NORMAL: 'normal',
} as const;

export type SlotType = (typeof SlotType)[keyof typeof SlotType];

export const CardType = {
  HP: 'hp',
  SHIELD: 'shield',
  WEAPON: 'weapon',
  SPELL: 'spell',
  PASSIVE: 'passive',
} as const;

export type CardType = (typeof CardType)[keyof typeof CardType];

export interface CardStats {
  hp?: number;
  attack?: number;
  defense?: number;
  value: number;
}

export interface Card {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  rarity: CardRarity;
  type: CardType;
  stats: CardStats;
  slot?: SlotType;
  abilities?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  damage?: number;
  effect?: string;
  iconUrl?: string;
}

export interface Boss {
  id: string;
  name: string;
  description: string;
  spriteUrl?: string;
  hp: number;
  maxHp: number;
  phase: number;
  abilities: Ability[];
}
