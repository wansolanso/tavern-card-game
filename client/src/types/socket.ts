import type { Card } from './card';
import type { ApiGame } from './api';

export const ConnectionStatus = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed'
} as const;

export type ConnectionStatus = typeof ConnectionStatus[keyof typeof ConnectionStatus];

export interface ConnectionMetrics {
  latency: number;
  lastPingTime: number | null;
  packetLoss: number;
}

export interface QueuedMessage {
  id: string;
  event: string;
  data: unknown;
  timestamp: number;
  priority: number;
  ttl: number;
}

export interface SocketContextValue {
  socket: import('socket.io-client').Socket | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  retryAttempt: number;
  lastConnected: Date | null;
  metrics: ConnectionMetrics;
  emit: <T = unknown>(event: string, data: T, priority?: number) => void;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * Socket.io Event Payload Types
 * Type definitions for all Socket.io event payloads
 */

/**
 * Combat log entry from server
 */
export interface CombatLogEntry {
  action: string;
  result: string;
  damage?: number;
  actor?: string;
  target?: string;
  message?: string;
}

/**
 * Combat result payload
 * Emitted: 'combat_result'
 */
export interface CombatResultPayload {
  success: boolean;
  message?: string;
  game: ApiGame;
  combatLog?: CombatLogEntry[];
  targetDestroyed?: boolean;
  playerHp?: number;
  playerMaxHp?: number;
  newCard?: Card;
}

/**
 * Game updated payload
 * Emitted: 'game_updated'
 */
export interface GameUpdatedPayload {
  game: ApiGame;
  tavern?: Card[];
  hand?: Card[];
  equipped?: Record<string, Card>;
  reason?: 'combat' | 'equip' | 'discard' | 'phase_change';
}

/**
 * Socket error payload
 * Emitted: 'error'
 */
export interface SocketErrorPayload {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}
