# Tavern Card Game - Frontend Architecture

## 1. Component Hierarchy

```
App
├── Providers
│   ├── SocketProvider (WebSocket context)
│   └── ThemeProvider (optional dark mode)
│
├── Layout
│   ├── GameHeader
│   │   ├── PlayerStats (HP, level, score)
│   │   ├── TurnIndicator
│   │   └── GameMenu (pause, settings, quit)
│   │
│   └── MainContent
│       └── Router
│           ├── GameBoard (main screen)
│           ├── BossFight
│           └── GameOver
│
└── GlobalComponents
    ├── NotificationSystem
    └── LoadingOverlay

---

### GameBoard Screen
GameBoard
├── TavernArea
│   ├── TavernGrid
│   │   └── TavernCard[] (clickable cards)
│   │       ├── CardImage
│   │       ├── CardStats (HP, ATK, DEF)
│   │       └── CardRarity
│   │
│   └── TavernControls
│       └── RefreshButton (optional)
│
├── PlayerArea
│   ├── EquipmentSlots
│   │   └── EquipmentSlot[] (weapon, armor, accessory)
│   │       ├── SlotType
│   │       ├── EquippedCard (draggable)
│   │       └── EmptySlotPlaceholder
│   │
│   └── AbilityBar
│       ├── NormalAbility
│       └── SpecialAbility
│
├── HandArea
│   └── CardHand
│       ├── HandCard[] (draggable)
│       │   ├── CardPreview
│       │   ├── CardActions (equip, discard)
│       │   └── CardTooltip
│       │
│       └── HandControls
│           └── DiscardButton
│
└── CombatFeed
    └── CombatLog
        └── CombatEntry[] (scrollable)
            ├── ActionType
            ├── DamageNumbers
            └── Timestamp

---

### BossFight Screen
BossFight
├── BossDisplay
│   ├── BossSprite (animated)
│   ├── BossHealthBar
│   ├── BossName
│   └── PhaseIndicator
│
├── PlayerCombatArea
│   ├── EquippedCardsDisplay (read-only)
│   │   └── EquippedCard[]
│   │
│   └── AbilitiesPanel
│       ├── NormalAbility
│       └── SpecialAbility
│
└── CombatLog
    └── BossCombatEntry[]

---

### Shared Components
Components/UI
├── Card
│   ├── CardBase (base styling)
│   ├── TavernCard
│   ├── HandCard
│   └── EquippedCard
│
├── DragDrop
│   ├── Draggable (wrapper)
│   └── DropZone (wrapper)
│
├── Animations
│   ├── AttackAnimation
│   ├── DamageNumbers
│   ├── CardFlip
│   └── ShakeEffect
│
├── Modals
│   ├── SlotUpgradeModal
│   ├── GameOverModal
│   └── ConfirmationDialog
│
└── Common
    ├── Button
    ├── IconButton
    ├── ProgressBar
    ├── Badge
    └── Tooltip
```

---

## 2. Zustand Store Architecture

### Store Structure (Modular Slices)

```typescript
// store/index.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createPlayerSlice } from './slices/playerSlice';
import { createGameSlice } from './slices/gameSlice';
import { createCombatSlice } from './slices/combatSlice';
import { createUISlice } from './slices/uiSlice';

export const useGameStore = create(
  devtools(
    immer((...a) => ({
      ...createPlayerSlice(...a),
      ...createGameSlice(...a),
      ...createCombatSlice(...a),
      ...createUISlice(...a),
    }))
  )
);
```

### Player Slice
```typescript
// store/slices/playerSlice.ts
interface PlayerState {
  id: string;
  hp: number;
  maxHp: number;
  level: number;
  score: number;
  equippedCards: {
    weapon: Card | null;
    armor: Card | null;
    accessory: Card | null;
  };
  hand: Card[];
  slotLevels: {
    weapon: number;
    armor: number;
    accessory: number;
  };
  abilities: {
    normal: Ability | null;
    special: Ability | null;
  };
}

interface PlayerActions {
  setPlayerHp: (hp: number) => void;
  equipCard: (slot: SlotType, card: Card) => void;
  unequipCard: (slot: SlotType) => void;
  addToHand: (card: Card) => void;
  removeFromHand: (cardId: string) => void;
  upgradeSlot: (slot: SlotType) => void;
  setAbility: (type: 'normal' | 'special', ability: Ability) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  resetPlayer: () => void;
}
```

### Game Slice
```typescript
// store/slices/gameSlice.ts
interface GameState {
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

interface GameActions {
  initializeGame: (gameId: string) => void;
  setPhase: (phase: GameState['phase']) => void;
  incrementTurn: () => void;
  setTavernCards: (cards: Card[]) => void;
  removeTavernCard: (cardId: string) => void;
  setBoss: (boss: Boss) => void;
  updateBossHp: (hp: number) => void;
  endGame: (victory: boolean) => void;
  resetGame: () => void;
}
```

### Combat Slice
```typescript
// store/slices/combatSlice.ts
interface CombatState {
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

interface CombatActions {
  addCombatEntry: (entry: CombatEntry) => void;
  clearCombatLog: () => void;
  queueAnimation: (animation: Animation) => void;
  removeAnimation: (id: string) => void;
  queueDamage: (event: DamageEvent) => void;
  processDamageQueue: () => void;
  setProcessing: (processing: boolean) => void;
  selectTarget: (targetId: string | null) => void;
  setCooldown: (type: 'normal' | 'special', value: boolean) => void;
}
```

### UI Slice
```typescript
// store/slices/uiSlice.ts
interface UIState {
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

interface UIActions {
  selectCard: (card: Card | null) => void;
  setHoveredCard: (card: Card | null) => void;
  setDraggedCard: (card: Card | null) => void;
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setTooltip: (data: TooltipData | null) => void;
}
```

---

## 3. Routing Structure

### Single Page Application (Recommended for MVP)
```typescript
// router/index.tsx
// Phase-based routing without React Router
// Controlled by game.phase state

const AppRouter = () => {
  const phase = useGameStore((state) => state.phase);

  switch (phase) {
    case 'lobby':
      return <LobbyScreen />;
    case 'tavern':
      return <GameBoard />;
    case 'boss':
      return <BossFight />;
    case 'gameover':
      return <GameOver />;
    default:
      return <LoadingScreen />;
  }
};
```

### Alternative: React Router (if needed)
```typescript
// router/routes.tsx
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Lobby /> },
      { path: 'game/:gameId', element: <GameBoard /> },
      { path: 'boss/:gameId', element: <BossFight /> },
      { path: 'gameover', element: <GameOver /> },
    ],
  },
]);
```

---

## 4. WebSocket Integration

### Socket Provider
```typescript
// providers/SocketProvider.tsx
interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  emit: (event: string, data: any) => void;
}

// Event Handlers Mapping
const SOCKET_EVENTS = {
  // Incoming (Server -> Client)
  GAME_STATE_UPDATE: 'game:state:update',
  TAVERN_UPDATE: 'tavern:update',
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
};
```

### WebSocket Handlers
```typescript
// hooks/useSocketHandlers.ts
export const useSocketHandlers = () => {
  const { socket } = useSocket();
  const store = useGameStore();

  useEffect(() => {
    if (!socket) return;

    // Game state updates
    socket.on(SOCKET_EVENTS.GAME_STATE_UPDATE, (data: GameStateUpdate) => {
      store.setPhase(data.phase);
      store.incrementTurn();
    });

    // Tavern updates
    socket.on(SOCKET_EVENTS.TAVERN_UPDATE, (data: TavernUpdate) => {
      store.setTavernCards(data.cards);
    });

    // Combat events
    socket.on(SOCKET_EVENTS.DAMAGE_DEALT, (data: DamageEvent) => {
      store.queueDamage(data);
      store.addCombatEntry({
        type: 'damage',
        source: data.source,
        target: data.target,
        amount: data.amount,
        timestamp: Date.now(),
      });
    });

    // Boss events
    socket.on(SOCKET_EVENTS.BOSS_SPAWNED, (data: BossData) => {
      store.setBoss(data);
      store.setPhase('boss');
    });

    socket.on(SOCKET_EVENTS.BOSS_ATTACK, (data: BossAttack) => {
      store.takeDamage(data.damage);
      store.addCombatEntry({
        type: 'boss_attack',
        ability: data.ability,
        damage: data.damage,
        timestamp: Date.now(),
      });
    });

    // Game over
    socket.on(SOCKET_EVENTS.GAME_OVER, (data: GameOverData) => {
      store.endGame(data.victory);
    });

    // Error handling
    socket.on(SOCKET_EVENTS.ERROR, (error: ErrorEvent) => {
      store.addNotification({
        type: 'error',
        message: error.message,
        duration: 5000,
      });
    });

    return () => {
      socket.off(SOCKET_EVENTS.GAME_STATE_UPDATE);
      socket.off(SOCKET_EVENTS.TAVERN_UPDATE);
      socket.off(SOCKET_EVENTS.DAMAGE_DEALT);
      socket.off(SOCKET_EVENTS.BOSS_SPAWNED);
      socket.off(SOCKET_EVENTS.BOSS_ATTACK);
      socket.off(SOCKET_EVENTS.GAME_OVER);
      socket.off(SOCKET_EVENTS.ERROR);
    };
  }, [socket, store]);
};
```

### Action Emitters
```typescript
// hooks/useGameActions.ts
export const useGameActions = () => {
  const { emit } = useSocket();

  return {
    attackTavernCard: (cardId: string) => {
      emit(SOCKET_EVENTS.ATTACK_TAVERN, { cardId });
    },

    equipCard: (cardId: string, slot: SlotType) => {
      emit(SOCKET_EVENTS.EQUIP_CARD, { cardId, slot });
    },

    discardCard: (cardId: string, targetSlot: SlotType) => {
      emit(SOCKET_EVENTS.DISCARD_CARD, { cardId, targetSlot });
    },

    upgradeSlot: (slot: SlotType) => {
      emit(SOCKET_EVENTS.UPGRADE_SLOT, { slot });
    },

    useAbility: (type: 'normal' | 'special', targetId?: string) => {
      emit(SOCKET_EVENTS.USE_ABILITY, { type, targetId });
    },

    readyForBoss: () => {
      emit(SOCKET_EVENTS.READY_BOSS, {});
    },
  };
};
```

---

## 5. Animation Strategy

### Animation Architecture
```typescript
// animations/config.ts
export const ANIMATION_CONFIG = {
  // Durations (ms)
  CARD_FLIP: 300,
  CARD_MOVE: 400,
  ATTACK: 500,
  DAMAGE_NUMBERS: 1000,
  SHAKE: 200,
  FADE: 300,

  // Easing
  EASING: {
    smooth: [0.4, 0.0, 0.2, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
    quick: [0.4, 0.0, 1, 1],
  },

  // Springs (for React Spring)
  SPRINGS: {
    wobbly: { tension: 180, friction: 12 },
    stiff: { tension: 210, friction: 20 },
    slow: { tension: 120, friction: 14 },
  },
};
```

### Combat Animation Flow
```
Player Attacks Tavern Card:
1. Card Selection (highlight) → 100ms
2. Attack Animation (card moves toward target) → 400ms
3. Impact Effect (flash/shake) → 200ms
4. Damage Numbers (float up, fade) → 800ms
5. Card Death (if HP = 0, fade + scale down) → 400ms
6. Loot Animation (card to hand) → 500ms

Boss Attack:
1. Boss Charge Animation → 300ms
2. Attack Projectile/Effect → 600ms
3. Player Shake → 200ms
4. HP Bar Decrease → 400ms
5. Damage Numbers → 800ms

Card Equip (Drag-Drop):
1. Pick Up (scale up) → 100ms
2. Drag (follow cursor, rotate slightly) → continuous
3. Drop (snap to slot) → 300ms
4. Equip Effect (glow/pulse) → 500ms

Ability Use:
1. Button Press (scale down) → 100ms
2. Ability Animation (particle effect) → 800ms
3. Target Hit → 300ms
4. Damage Numbers → 800ms
5. Cooldown Indicator → continuous
```

### Animation Components
```typescript
// components/Animations/AttackAnimation.tsx
interface AttackAnimationProps {
  sourceId: string;
  targetId: string;
  onComplete: () => void;
}

// Using Framer Motion
const AttackAnimation: React.FC<AttackAnimationProps> = ({
  sourceId,
  targetId,
  onComplete,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={onComplete}
    >
      {/* Attack visual effect */}
    </motion.div>
  );
};

// components/Animations/DamageNumbers.tsx
const DamageNumbers: React.FC<{ damage: number; position: Position }> = ({
  damage,
  position,
}) => {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1, scale: 0.5 }}
      animate={{ y: -50, opacity: 0, scale: 1.2 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className="absolute text-red-500 font-bold text-2xl"
      style={{ left: position.x, top: position.y }}
    >
      -{damage}
    </motion.div>
  );
};
```

### Animation Queue System
```typescript
// hooks/useAnimationQueue.ts
export const useAnimationQueue = () => {
  const [queue, setQueue] = useState<Animation[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const addAnimation = (animation: Animation) => {
    setQueue((prev) => [...prev, animation]);
  };

  const playNext = async () => {
    if (queue.length === 0) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const [current, ...rest] = queue;

    // Play animation
    await current.play();

    setQueue(rest);
    playNext();
  };

  useEffect(() => {
    if (!isPlaying && queue.length > 0) {
      playNext();
    }
  }, [queue, isPlaying]);

  return { addAnimation, isPlaying };
};
```

---

## 6. Responsive Design Strategy

### Breakpoints
```typescript
// config/breakpoints.ts
export const BREAKPOINTS = {
  // Desktop-first (MVP priority)
  desktop: '1920px',  // Optimal
  laptop: '1440px',   // Standard
  tablet: '1024px',   // Minimum playable
  mobile: '768px',    // Future phase
};

// Tailwind config
module.exports = {
  theme: {
    screens: {
      'xl': '1440px',
      'lg': '1024px',
      'md': '768px',
    },
  },
};
```

### Layout Strategy
```typescript
// Desktop Priority (1440px+)
- Game Board: 3-column layout (Tavern | Center | Hand)
- Card Size: 200x280px
- Tavern Grid: 3x3 or 4x3
- Hand: Horizontal row, max 7 cards visible
- Combat Log: Fixed sidebar, 300px width

// Laptop (1024px - 1440px)
- Compress spacing by 20%
- Card Size: 160x224px
- Tavern Grid: 3x3
- Hand: Slightly overlapped cards
- Combat Log: Collapsible sidebar

// Tablet (768px - 1024px)
- 2-column layout (Stack vertically)
- Card Size: 140x196px
- Tavern Grid: 2x4
- Hand: Bottom fixed, swipe scroll
- Combat Log: Modal overlay

// Mobile (< 768px) - Future
- Single column, stacked
- Card Size: 120x168px
- Touch-optimized gestures
- Fullscreen modal for details
```

### Container Queries (Modern Approach)
```css
/* components/Card/Card.module.css */
.card-container {
  container-type: inline-size;
}

.card {
  /* Base size */
  width: 200px;
  height: 280px;
}

@container (max-width: 600px) {
  .card {
    width: 160px;
    height: 224px;
  }
}

@container (max-width: 400px) {
  .card {
    width: 120px;
    height: 168px;
  }
}
```

---

## 7. TypeScript Interfaces

### Core Types
```typescript
// types/card.ts
export enum CardRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum SlotType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory',
}

export interface CardStats {
  hp: number;
  attack: number;
  defense: number;
}

export interface Card {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: CardRarity;
  stats: CardStats;
  slot?: SlotType;
  abilities?: string[];
  createdAt: number;
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
  spriteUrl: string;
  hp: number;
  maxHp: number;
  phase: number;
  abilities: Ability[];
}
```

### Component Props
```typescript
// types/components.ts
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
```

### State Types
```typescript
// types/state.ts
export interface CombatEntry {
  id: string;
  type: 'damage' | 'heal' | 'ability' | 'boss_attack' | 'card_equipped' | 'card_destroyed';
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
```

### WebSocket Types
```typescript
// types/websocket.ts
export interface SocketEmitEvents {
  'action:attack:tavern': { cardId: string };
  'action:equip': { cardId: string; slot: SlotType };
  'action:discard': { cardId: string; targetSlot: SlotType };
  'action:upgrade': { slot: SlotType };
  'action:ability': { type: 'normal' | 'special'; targetId?: string };
  'action:boss:ready': {};
}

export interface SocketListenEvents {
  'game:state:update': GameStateUpdate;
  'tavern:update': { cards: Card[] };
  'card:equipped': { card: Card; slot: SlotType };
  'combat:damage': DamageEvent;
  'boss:spawned': Boss;
  'boss:attack': { ability: string; damage: number };
  'game:over': { victory: boolean; score: number };
  'error': { message: string; code?: string };
}
```

---

## 8. Accessibility Checklist

### Semantic HTML
- [ ] Use proper heading hierarchy (h1 → h6)
- [ ] Use semantic elements (main, section, article, nav)
- [ ] Use button elements for clickable actions
- [ ] Use form elements for inputs
- [ ] Provide landmark regions (role="main", role="navigation")

### Keyboard Navigation
- [ ] All interactive elements focusable (tabIndex)
- [ ] Logical tab order throughout UI
- [ ] Escape key closes modals
- [ ] Arrow keys navigate card grids
- [ ] Enter/Space activates buttons
- [ ] Focus visible indicator (outline)
- [ ] Focus trap in modals

### Screen Readers
- [ ] All images have alt text
- [ ] Interactive elements have aria-label
- [ ] Dynamic content uses aria-live regions
- [ ] Form inputs have associated labels
- [ ] Cards have descriptive aria-labels
- [ ] Combat log has aria-live="polite"
- [ ] Notifications use aria-live="assertive"
- [ ] Hidden content uses aria-hidden

### Visual Accessibility
- [ ] Color contrast ratio ≥ 4.5:1 (WCAG AA)
- [ ] Don't rely solely on color for information
- [ ] Text scalable up to 200%
- [ ] Focus indicators visible
- [ ] Animations respect prefers-reduced-motion
- [ ] Support dark/light modes
- [ ] Card rarity indicated with icons + color

### Interaction Patterns
- [ ] Drag-and-drop has keyboard alternative
- [ ] Tooltips show on focus, not just hover
- [ ] Error messages are descriptive
- [ ] Loading states announced to screen readers
- [ ] Confirm destructive actions
- [ ] Provide undo for critical actions

### ARIA Implementation
```typescript
// Example: Accessible Card Component
<div
  role="button"
  tabIndex={0}
  aria-label={`${card.name}, ${card.rarity} rarity, HP: ${card.stats.hp}, Attack: ${card.stats.attack}, Defense: ${card.stats.defense}`}
  aria-pressed={isSelected}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick(card);
    }
  }}
>
  <img src={card.imageUrl} alt={`${card.name} card illustration`} />
  {/* Card content */}
</div>

// Example: Accessible Combat Log
<section
  role="log"
  aria-live="polite"
  aria-label="Combat history"
  aria-atomic="false"
>
  {entries.map(entry => (
    <div key={entry.id} role="listitem">
      {entry.message}
    </div>
  ))}
</section>

// Example: Accessible Modal
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Upgrade Slot</h2>
  <p id="modal-description">Choose which slot to upgrade...</p>
  {/* Modal content */}
</div>
```

### Testing Tools
- [ ] Use axe DevTools
- [ ] Use WAVE browser extension
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Test keyboard-only navigation
- [ ] Test with Windows High Contrast mode
- [ ] Lighthouse accessibility audit

---

## 9. Project Structure

```
src/
├── components/
│   ├── Board/
│   │   ├── GameBoard.tsx
│   │   ├── TavernArea.tsx
│   │   ├── PlayerArea.tsx
│   │   └── HandArea.tsx
│   │
│   ├── Boss/
│   │   ├── BossFight.tsx
│   │   ├── BossDisplay.tsx
│   │   └── BossCombatLog.tsx
│   │
│   ├── Cards/
│   │   ├── Card.tsx
│   │   ├── TavernCard.tsx
│   │   ├── HandCard.tsx
│   │   ├── EquippedCard.tsx
│   │   └── CardTooltip.tsx
│   │
│   ├── Combat/
│   │   ├── CombatLog.tsx
│   │   ├── CombatEntry.tsx
│   │   └── AbilityButton.tsx
│   │
│   ├── Equipment/
│   │   ├── EquipmentSlots.tsx
│   │   ├── EquipmentSlot.tsx
│   │   └── SlotUpgradeModal.tsx
│   │
│   ├── Layout/
│   │   ├── GameHeader.tsx
│   │   ├── PlayerStats.tsx
│   │   └── TurnIndicator.tsx
│   │
│   ├── Animations/
│   │   ├── AttackAnimation.tsx
│   │   ├── DamageNumbers.tsx
│   │   ├── CardFlip.tsx
│   │   └── ShakeEffect.tsx
│   │
│   └── UI/
│       ├── Button.tsx
│       ├── ProgressBar.tsx
│       ├── Modal.tsx
│       ├── Notification.tsx
│       └── Tooltip.tsx
│
├── store/
│   ├── index.ts
│   └── slices/
│       ├── playerSlice.ts
│       ├── gameSlice.ts
│       ├── combatSlice.ts
│       └── uiSlice.ts
│
├── hooks/
│   ├── useSocket.ts
│   ├── useSocketHandlers.ts
│   ├── useGameActions.ts
│   ├── useAnimationQueue.ts
│   ├── useDragDrop.ts
│   └── useKeyboardNav.ts
│
├── providers/
│   ├── SocketProvider.tsx
│   └── ThemeProvider.tsx
│
├── types/
│   ├── card.ts
│   ├── components.ts
│   ├── state.ts
│   └── websocket.ts
│
├── animations/
│   ├── config.ts
│   └── variants.ts
│
├── utils/
│   ├── cardHelpers.ts
│   ├── combatHelpers.ts
│   └── formatters.ts
│
├── config/
│   ├── constants.ts
│   └── breakpoints.ts
│
└── App.tsx
```

---

## 10. Data Flow Diagram

```
WebSocket Server
       ↓
SocketProvider (context)
       ↓
useSocketHandlers (effect)
       ↓
Zustand Store (state update)
       ↓
Components (re-render)
       ↓
UI Update + Animations
       ↓
User Interaction (click/drag)
       ↓
useGameActions (emit)
       ↓
WebSocket Server

---

Optimistic Updates Flow:
User Action (client)
       ↓
Optimistic State Update (Zustand)
       ↓
UI Update (immediate feedback)
       ↓
WebSocket Emit (to server)
       ↓
Server Validation
       ↓
Server Response
       ↓
Reconcile State (confirm or rollback)
```

---

## 11. Performance Optimization

### Code Splitting
```typescript
// Lazy load screens
const BossFight = lazy(() => import('./components/Boss/BossFight'));
const GameOver = lazy(() => import('./components/GameOver/GameOver'));

// Route-based splitting
<Suspense fallback={<LoadingScreen />}>
  <BossFight />
</Suspense>
```

### React Optimization
```typescript
// Memoize expensive computations
const totalStats = useMemo(() => {
  return calculateTotalStats(equippedCards);
}, [equippedCards]);

// Memoize callbacks
const handleAttack = useCallback((cardId: string) => {
  attackTavernCard(cardId);
}, [attackTavernCard]);

// Memoize components
export const Card = memo(CardComponent, (prev, next) => {
  return prev.card.id === next.card.id && prev.isSelected === next.isSelected;
});

// Virtual scrolling for combat log
import { useVirtual } from '@tanstack/react-virtual';
```

### Asset Optimization
- Use WebP images with fallbacks
- Lazy load card images
- Preload critical assets
- Use sprite sheets for animations
- Implement image CDN

### Bundle Optimization
- Tree shaking
- Dynamic imports
- Analyze bundle with `vite-bundle-visualizer`
- Remove unused dependencies
- Use production builds

---

## 12. Development Workflow

### Initial Setup
```bash
# Create Vite + React + TypeScript project
npm create vite@latest tavern-game -- --template react-ts
cd tavern-game
npm install

# Install dependencies
npm install zustand framer-motion socket.io-client
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node

# Initialize Tailwind
npx tailwindcss init -p
```

### Development Commands
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx}\"",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

### Environment Variables
```env
# .env.development
VITE_WS_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001/api

# .env.production
VITE_WS_URL=wss://api.tavern-game.com
VITE_API_URL=https://api.tavern-game.com/api
```

---

## Summary

This architecture provides:
- **Scalable component hierarchy** with clear separation of concerns
- **Modular state management** using Zustand slices
- **Real-time WebSocket integration** with event-driven architecture
- **Smooth animations** with Framer Motion
- **Responsive design** prioritizing desktop experience
- **Type-safe TypeScript** interfaces throughout
- **Accessible UI** following WCAG guidelines
- **Performance optimization** with code splitting and memoization

Next steps:
1. Set up project structure
2. Implement core components
3. Integrate WebSocket handlers
4. Add animations and transitions
5. Test accessibility
6. Optimize performance
