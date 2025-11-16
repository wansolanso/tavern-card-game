/**
 * Runtime Type Guards
 * Type guards for safe type narrowing and runtime validation
 */

import type { Card, Boss } from '../types/card';
import type { ApiPlayer, ApiGame } from '../types/api';
import type { CombatLogEntry, CombatResultPayload, GameUpdatedPayload } from '../types/socket';

/**
 * Type guard for Card
 */
export function isCard(value: unknown): value is Card {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as Card).id === 'string' &&
    typeof (value as Card).name === 'string' &&
    'rarity' in value &&
    'type' in value &&
    'stats' in value
  );
}

/**
 * Type guard for Card array
 */
export function isCardArray(value: unknown): value is Card[] {
  return Array.isArray(value) && value.every(isCard);
}

/**
 * Type guard for Boss
 */
export function isBoss(value: unknown): value is Boss {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'hp' in value &&
    'maxHp' in value &&
    'abilities' in value
  );
}

/**
 * Type guard for ApiPlayer
 */
export function isApiPlayer(value: unknown): value is ApiPlayer {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'currentHp' in value &&
    'maxHp' in value &&
    typeof (value as ApiPlayer).id === 'string' &&
    typeof (value as ApiPlayer).currentHp === 'number' &&
    typeof (value as ApiPlayer).maxHp === 'number'
  );
}

/**
 * Type guard for ApiGame
 */
export function isApiGame(value: unknown): value is ApiGame {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'player_id' in value &&
    'phase' in value &&
    'current_turn' in value &&
    typeof (value as ApiGame).id === 'number' &&
    typeof (value as ApiGame).player_id === 'string'
  );
}

/**
 * Type guard for CombatLogEntry
 */
export function isCombatLogEntry(value: unknown): value is CombatLogEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    'action' in value &&
    'result' in value &&
    typeof (value as CombatLogEntry).action === 'string' &&
    typeof (value as CombatLogEntry).result === 'string'
  );
}

/**
 * Type guard for CombatLogEntry array
 */
export function isCombatLogArray(value: unknown): value is CombatLogEntry[] {
  return Array.isArray(value) && value.every(isCombatLogEntry);
}

/**
 * Type guard for CombatResultPayload
 */
export function isCombatResultPayload(value: unknown): value is CombatResultPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const payload = value as Partial<CombatResultPayload>;

  return (
    typeof payload.success === 'boolean' &&
    payload.game !== undefined &&
    isApiGame(payload.game)
  );
}

/**
 * Type guard for GameUpdatedPayload
 */
export function isGameUpdatedPayload(value: unknown): value is GameUpdatedPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const payload = value as Partial<GameUpdatedPayload>;

  return (
    payload.game !== undefined &&
    isApiGame(payload.game)
  );
}

/**
 * Type guard for objects with message property
 */
export function hasMessage(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as { message: unknown }).message === 'string'
  );
}

/**
 * Type guard for objects with code property
 */
export function hasCode(value: unknown): value is { code: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof (value as { code: unknown }).code === 'string'
  );
}

/**
 * Type guard for Axios error responses
 */
export function isAxiosError(error: unknown): error is {
  response?: {
    data?: unknown;
    status?: number;
    statusText?: string;
  };
  message: string;
  code?: string;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Safe JSON parse with type validation
 */
export function safeJsonParse<T>(
  json: string,
  validator: (value: unknown) => value is T
): T | null {
  try {
    const parsed = JSON.parse(json);
    return validator(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Assert value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Assert value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Assert value is a valid number (not NaN or Infinity)
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}
