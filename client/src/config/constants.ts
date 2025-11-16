export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  API_VERSION: 'v1',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    GUEST: '/auth/guest',
  },
  GAMES: {
    CREATE: '/games',
    LIST: '/games',
    GET: (id: string) => `/games/${id}`,
    EQUIP: (id: string) => `/games/${id}/equip`,
    UNEQUIP: (id: string) => `/games/${id}/unequip`,
    DISCARD: (id: string) => `/games/${id}/discard`,
    UPGRADE_SLOT: (id: string) => `/games/${id}/upgrade-slot`,
    ATTACK: (id: string) => `/games/${id}/attack`,
  },
  CARDS: {
    LIST: '/cards',
    GET: (id: string) => `/cards/${id}`,
  },
} as const;

export const GAME_CONFIG = {
  MAX_HAND_SIZE: 7,
  TAVERN_GRID_SIZE: 9,
  INITIAL_HP: 100,
  SLOT_TYPES: ['hp', 'shield', 'special', 'passive', 'normal'] as const,
} as const;

export const UI_CONFIG = {
  NOTIFICATION_DURATION: 5000,
  ANIMATION_DURATION: {
    FAST: 200,
    NORMAL: 400,
    SLOW: 800,
  },
  CARD_SIZE: {
    WIDTH: 200,
    HEIGHT: 280,
  },
} as const;

export const BREAKPOINTS = {
  desktop: '1920px',
  laptop: '1440px',
  tablet: '1024px',
  mobile: '768px',
} as const;
