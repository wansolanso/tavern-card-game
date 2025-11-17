/**
 * Game Constants - Single Source of Truth
 *
 * Centralizes all hardcoded game configuration values to prevent
 * duplication and ensure consistency across the codebase.
 */

/**
 * Slot Types - Equipment slot categories
 * These are the valid types of equipment slots players can use
 */
const SLOT_TYPES = {
  HP: 'hp',
  SHIELD: 'shield',
  SPECIAL: 'special',
  PASSIVE: 'passive',
  NORMAL: 'normal'
};

/**
 * Valid slot types as array for validation
 */
const VALID_SLOTS = Object.values(SLOT_TYPES);

/**
 * Game Phases - Possible states of game progression
 */
const GAME_PHASES = {
  TAVERN: 'tavern',
  COMBAT: 'combat',
  MANAGEMENT: 'management',
  VICTORY: 'victory',
  DEFEAT: 'defeat'
};

/**
 * Valid game phases as array for validation
 */
const VALID_PHASES = Object.values(GAME_PHASES);

/**
 * Game Status - Overall game state
 */
const GAME_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned'
};

/**
 * Cache Configuration - Cache key prefixes and TTL values
 */
const CACHE_CONFIG = {
  // Cache key prefixes
  CARDS_PREFIX: 'cards',
  GAME_PREFIX: 'game',
  SESSION_PREFIX: 'session',

  // Cache TTL values (in seconds)
  GAME_TTL: 60 * 5,            // 5 minutes
  CARD_TTL: 60 * 60,           // 1 hour
  SESSION_TTL: 24 * 60 * 60    // 24 hours
};

/**
 * Game Configuration Values
 */
const GAME_CONFIG = {
  // Tavern configuration
  TAVERN_SIZE: 6,                    // Number of cards in tavern at once

  // Player configuration
  STARTING_HP: 100,                  // Initial player health points
  STARTING_MAX_HP: 100,              // Initial max HP
  STARTING_HAND_SIZE: 4,             // Number of cards player starts with

  // Cache configuration (for backwards compatibility)
  GAME_CACHE_TTL: CACHE_CONFIG.GAME_TTL,
  CARD_CACHE_TTL: CACHE_CONFIG.CARD_TTL,
  SESSION_CACHE_TTL: CACHE_CONFIG.SESSION_TTL,

  // Combat configuration
  MIN_DAMAGE: 0,                     // Minimum damage dealt
  MIN_HP: 0,                         // Minimum HP (death threshold)

  // Turn configuration
  STARTING_TURN: 1                   // First turn number
};

/**
 * Card Locations - Where cards can be in game
 */
const CARD_LOCATIONS = {
  HAND: 'hand',
  EQUIPPED: 'equipped',
  TAVERN: 'tavern',
  DISCARDED: 'discarded'
};

/**
 * Ability Types - Types of card abilities
 */
const ABILITY_TYPES = {
  DAMAGE: 'damage',
  HEAL: 'heal',
  SHIELD: 'shield',
  BUFF: 'buff',
  DEBUFF: 'debuff',
  SPECIAL: 'special'
};

/**
 * Combat Events - Types of combat log events
 */
const COMBAT_EVENTS = {
  ATTACK: 'attack',
  DAMAGE: 'damage',
  HEAL: 'heal',
  SHIELD: 'shield',
  ABILITY_USED: 'ability_used',
  DEATH: 'death'
};

/**
 * Card Rarities - Rarity tiers for cards
 */
const CARD_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

/**
 * Validation Helper Functions
 */
const validation = {
  /**
   * Check if slot type is valid
   */
  isValidSlot: (slot) => VALID_SLOTS.includes(slot),

  /**
   * Check if game phase is valid
   */
  isValidPhase: (phase) => VALID_PHASES.includes(phase),

  /**
   * Check if HP value is valid
   */
  isValidHP: (hp) => typeof hp === 'number' && hp >= GAME_CONFIG.MIN_HP,

  /**
   * Clamp HP to valid range
   */
  clampHP: (hp, maxHP) => Math.max(GAME_CONFIG.MIN_HP, Math.min(hp, maxHP))
};

/**
 * Export all constants
 */
module.exports = {
  // Slot configuration
  SLOT_TYPES,
  VALID_SLOTS,

  // Game phases
  GAME_PHASES,
  VALID_PHASES,

  // Game status
  GAME_STATUS,

  // Cache configuration
  CACHE_CONFIG,

  // Game configuration
  GAME_CONFIG,

  // Card configuration
  CARD_LOCATIONS,
  CARD_RARITY,

  // Combat configuration
  ABILITY_TYPES,
  COMBAT_EVENTS,

  // Validation helpers
  validation
};
