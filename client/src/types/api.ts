import type { Card, SlotType } from './card';

/**
 * API Response Types
 * Type definitions for all backend API responses
 */

/**
 * Base API response wrapper
 * All API endpoints return this structure
 */
export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

/**
 * Player data from API
 */
export interface ApiPlayer {
  id: string;
  username?: string;
  currentHp: number;
  maxHp: number;
  level: number;
  score: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Game data from API
 */
export interface ApiGame {
  id: number;
  player_id: string;
  phase: 'lobby' | 'tavern' | 'boss' | 'gameover';
  current_turn: number;
  player_current_hp: number;
  player_max_hp: number;
  tavern?: Card[];
  hand?: Card[];
  equipped?: Record<string, Card>;
  boss_data?: unknown;
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

/**
 * Guest session creation response
 * POST /api/v1/auth/guest
 */
export interface GuestSessionResponse {
  player: ApiPlayer;
  token: string;
  expiresAt: string;
}

/**
 * Game creation response
 * POST /api/v1/games
 */
export interface GameCreateResponse {
  game: ApiGame;
}

/**
 * Game state response
 * GET /api/v1/games/:id
 */
export interface GameStateResponse {
  game: ApiGame;
  hand: Card[];
  equipped: Record<SlotType, Card | null>;
  tavern: Card[];
}

/**
 * Attack action response
 * POST /api/v1/games/:id/attack
 */
export interface AttackResponse {
  success: boolean;
  message: string;
  game: ApiGame;
  combatLog?: Array<{
    action: string;
    result: string;
    damage?: number;
  }>;
  targetDestroyed?: boolean;
}

/**
 * Equip action response
 * POST /api/v1/games/:id/equip
 */
export interface EquipResponse {
  success: boolean;
  message: string;
  game: ApiGame;
  equipped: Record<string, Card>;
}

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}
