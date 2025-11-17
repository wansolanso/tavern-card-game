import { SlotType } from './card';
import type { Card, Boss } from './card';
import type { GameStateUpdate, DamageEvent } from './state';

export interface SocketEmitEvents {
  'action:attack:tavern': { cardId: string };
  'action:equip': { cardId: string; slot: SlotType };
  'action:discard': { cardId: string; targetSlot: SlotType };
  'action:upgrade': { slot: SlotType };
  'action:ability': { type: 'normal' | 'special'; targetId?: string };
  'action:boss:ready': Record<string, never>;
}

export interface SocketListenEvents {
  'game:state:update': GameStateUpdate;
  'card:equipped': { card: Card; slot: SlotType };
  'combat:damage': DamageEvent;
  'boss:spawned': Boss;
  'boss:attack': { ability: string; damage: number };
  'game:over': { victory: boolean; score: number };
  'error': { message: string; code?: string };
}

export const SOCKET_EVENTS = {
  // Incoming (Server -> Client)
  GAME_STATE_UPDATE: 'game:state:update',
  CARD_EQUIPPED: 'card:equipped',
  DAMAGE_DEALT: 'combat:damage',
  BOSS_SPAWNED: 'boss:spawned',
  BOSS_ATTACK: 'boss:attack',
  GAME_OVER: 'game:over',
  ERROR: 'error',

  // Outgoing (Client -> Server)
  ATTACK_TAVERN: 'action:attack:tavern',
  EQUIP_CARD: 'action:equip',
  DISCARD_CARD: 'action:discard',
  UPGRADE_SLOT: 'action:upgrade',
  USE_ABILITY: 'action:ability',
  READY_BOSS: 'action:boss:ready',
} as const;
