export const ANIMATION_CONFIG = {
  // Durations (ms)
  CARD_FLIP: 300,
  CARD_MOVE: 400,
  ATTACK: 500,
  DAMAGE_NUMBERS: 1000,
  SHAKE: 200,
  FADE: 300,

  // Easing functions
  EASING: {
    smooth: [0.4, 0.0, 0.2, 1] as const,
    bounce: [0.68, -0.55, 0.265, 1.55] as const,
    quick: [0.4, 0.0, 1, 1] as const,
  },

  // Spring configurations for Framer Motion
  SPRINGS: {
    wobbly: { tension: 180, friction: 12 },
    stiff: { tension: 210, friction: 20 },
    slow: { tension: 120, friction: 14 },
  },
} as const;

export const ANIMATION_VARIANTS = {
  card: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    hover: { scale: 1.05, y: -5 },
    tap: { scale: 0.95 },
  },

  damage: {
    initial: { y: 0, opacity: 1, scale: 0.5 },
    animate: {
      y: -50,
      opacity: 0,
      scale: 1.2,
      transition: { duration: 1, ease: 'easeOut' }
    },
  },

  attack: {
    initial: { x: 0 },
    animate: {
      x: [0, 20, 0],
      transition: { duration: 0.5, ease: 'easeInOut' }
    },
  },

  shake: {
    animate: {
      x: [0, -5, 5, -5, 5, 0],
      transition: { duration: 0.3 }
    },
  },

  modal: {
    overlay: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    content: {
      initial: { scale: 0.9, opacity: 0, y: 20 },
      animate: { scale: 1, opacity: 1, y: 0 },
      exit: { scale: 0.9, opacity: 0, y: 20 },
    },
  },

  notification: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 300, opacity: 0 },
  },
} as const;
