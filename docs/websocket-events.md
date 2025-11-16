# WebSocket Events Specification

## Overview

The Tavern Card Game uses Socket.io for real-time bidirectional communication between client and server. This enables immediate game state updates, combat notifications, and future multiplayer features.

## Connection Architecture

```
Client                          Server
  │                               │
  │  ─── Socket.io Handshake ──→  │
  │  ←── Connection Accept ─────  │
  │                               │
  │  ─── auth:authenticate ────→  │
  │  ←── auth:authenticated ────  │
  │                               │
  │  ─── game:join ───────────→  │
  │  ←── game:state ────────────  │
  │                               │
  │  (REST: POST /combat) ─────→  │
  │  ←── combat:initiated ──────  │
  │  ←── game:state:updated ────  │
  │                               │
```

## Connection Management

### Client Connection

```javascript
// Client-side connection
import { io } from 'socket.io-client';

const socket = io('https://tavern-api.railway.app', {
  auth: {
    token: 'jwt_token_here'
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000
});
```

### Server Configuration

```javascript
// Server-side setup
import { Server } from 'socket.io';

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});
```

## Event Namespaces

### Default Namespace: `/`
All game events use the default namespace for simplicity in MVP.

**Future namespaces (multiplayer):**
- `/matchmaking` - Player matching, lobbies
- `/pvp` - Real-time PvP combat
- `/spectate` - Spectator mode for tournaments

## Authentication Events

### `auth:authenticate`
**Direction:** Client → Server
**Description:** Authenticate WebSocket connection with JWT token

**Payload:**
```typescript
{
  token: string; // JWT token from /auth/guest
}
```

**Server Response:**
- Success: `auth:authenticated`
- Error: `auth:error`

**Example:**
```javascript
// Client
socket.emit('auth:authenticate', {
  token: localStorage.getItem('authToken')
});

socket.on('auth:authenticated', (data) => {
  console.log('Authenticated as player:', data.playerId);
});
```

---

### `auth:authenticated`
**Direction:** Server → Client
**Description:** Confirmation of successful authentication

**Payload:**
```typescript
{
  playerId: string;
  expiresAt: string; // ISO 8601 timestamp
}
```

**Example:**
```javascript
socket.on('auth:authenticated', ({ playerId, expiresAt }) => {
  console.log(`Authenticated as ${playerId}, expires ${expiresAt}`);
});
```

---

### `auth:error`
**Direction:** Server → Client
**Description:** Authentication failure

**Payload:**
```typescript
{
  code: 'INVALID_TOKEN' | 'TOKEN_EXPIRED' | 'UNAUTHORIZED';
  message: string;
}
```

**Example:**
```javascript
socket.on('auth:error', ({ code, message }) => {
  console.error('Auth failed:', code, message);
  // Redirect to login or refresh token
});
```

## Game Room Events

### `game:join`
**Direction:** Client → Server
**Description:** Join a specific game room to receive state updates

**Payload:**
```typescript
{
  gameId: string;
}
```

**Server Response:**
- Success: `game:joined` + `game:state`
- Error: `game:error`

**Example:**
```javascript
// Client
socket.emit('game:join', { gameId: 'game_123' });

socket.on('game:joined', ({ gameId }) => {
  console.log(`Joined game room: ${gameId}`);
});
```

---

### `game:joined`
**Direction:** Server → Client
**Description:** Confirmation of joining game room

**Payload:**
```typescript
{
  gameId: string;
  roomId: string; // Socket.io room identifier
}
```

---

### `game:leave`
**Direction:** Client → Server
**Description:** Leave a game room (stop receiving updates)

**Payload:**
```typescript
{
  gameId: string;
}
```

**Server Response:**
- `game:left`

---

### `game:state`
**Direction:** Server → Client
**Description:** Full game state (sent on join or explicit request)

**Payload:**
```typescript
{
  game: {
    gameId: string;
    playerId: string;
    status: 'active' | 'completed' | 'abandoned';
    currentTurn: number;
    phase: 'tavern' | 'combat' | 'management' | 'victory' | 'defeat';
    equippedSlots: {
      hp: Card[];
      shield: Card[];
      special: Card[];
      passive: Card[];
      normal: Card[];
    };
    slotUpgrades: {
      hp: boolean;
      shield: boolean;
      special: boolean;
      passive: boolean;
      normal: boolean;
    };
    reserveCards: Card[];
    tavernCards: TavernCard[];
    activeCombat: CombatState | null;
    bossDefeated: boolean;
    createdAt: string;
    updatedAt: string;
  };
  timestamp: string; // ISO 8601
}
```

**Example:**
```javascript
socket.on('game:state', ({ game, timestamp }) => {
  // Update entire game state in client store
  gameStore.setState(game);
});
```

---

### `game:state:updated`
**Direction:** Server → Client (Broadcast to game room)
**Description:** Partial game state update (efficient delta updates)

**Payload:**
```typescript
{
  gameId: string;
  updates: {
    currentTurn?: number;
    phase?: 'tavern' | 'combat' | 'management' | 'victory' | 'defeat';
    equippedSlots?: Record<string, Card[]>;
    reserveCards?: Card[];
    tavernCards?: TavernCard[];
    activeCombat?: CombatState | null;
    bossDefeated?: boolean;
  };
  timestamp: string;
}
```

**Example:**
```javascript
socket.on('game:state:updated', ({ gameId, updates, timestamp }) => {
  // Merge updates into existing state
  gameStore.mergeUpdates(updates);
});
```

---

### `game:error`
**Direction:** Server → Client
**Description:** Game operation error

**Payload:**
```typescript
{
  code: string; // Error code (e.g., 'GAME_NOT_FOUND')
  message: string;
  details?: Record<string, any>;
}
```

## Combat Events

### `combat:initiated`
**Direction:** Server → Client (Broadcast to game room)
**Description:** Combat started with tavern card

**Payload:**
```typescript
{
  gameId: string;
  combat: {
    combatId: string;
    targetCard: Card;
    targetCurrentHp: number;
    targetCurrentShield: number;
    turn: 1;
    playerStats: {
      totalHp: number;
      currentHp: number;
      totalShield: number;
      currentShield: number;
      attackPower: number;
      abilities: Ability[];
    };
    status: 'active';
  };
  timestamp: string;
}
```

**Example:**
```javascript
socket.on('combat:initiated', ({ combat, timestamp }) => {
  // Navigate to combat screen
  combatStore.startCombat(combat);
  router.push('/combat');
});
```

---

### `combat:turn:executed`
**Direction:** Server → Client (Broadcast to game room)
**Description:** Combat turn completed (attack + retaliation)

**Payload:**
```typescript
{
  gameId: string;
  combatId: string;
  turn: number;
  events: CombatEvent[];
  playerStats: {
    currentHp: number;
    currentShield: number;
  };
  enemyStats: {
    currentHp: number;
    currentShield: number;
  };
  status: 'active' | 'victory' | 'defeat';
  timestamp: string;
}
```

**CombatEvent Structure:**
```typescript
{
  turn: number;
  actor: 'player' | 'enemy';
  action: 'attack' | 'ability' | 'retaliation';
  result: {
    damage?: number;
    shieldDamage?: number;
    hpDamage?: number;
    abilityUsed?: string;
    effects?: {
      type: string;
      value: number;
    }[];
  };
  timestamp: string;
}
```

**Example:**
```javascript
socket.on('combat:turn:executed', ({ turn, events, playerStats, enemyStats, status }) => {
  // Animate combat events
  events.forEach(event => combatAnimations.play(event));

  // Update combat state
  combatStore.updateStats(playerStats, enemyStats);

  if (status === 'victory') {
    showVictoryScreen();
  } else if (status === 'defeat') {
    showDefeatScreen();
  }
});
```

---

### `combat:ended`
**Direction:** Server → Client (Broadcast to game room)
**Description:** Combat concluded

**Payload:**
```typescript
{
  gameId: string;
  combatId: string;
  outcome: 'victory' | 'defeat' | 'forfeit';
  rewards?: {
    cardAcquired?: Card;
    addedToReserve: boolean;
  };
  gamePhase: 'tavern' | 'management' | 'defeat';
  timestamp: string;
}
```

**Example:**
```javascript
socket.on('combat:ended', ({ outcome, rewards, gamePhase }) => {
  if (outcome === 'victory' && rewards?.cardAcquired) {
    showCardAcquiredAnimation(rewards.cardAcquired);
  }

  combatStore.endCombat();

  if (gamePhase === 'defeat') {
    router.push('/game-over');
  } else {
    router.push('/tavern');
  }
});
```

## Card Management Events

### `card:equipped`
**Direction:** Server → Client (Broadcast to game room)
**Description:** Card equipped to slot

**Payload:**
```typescript
{
  gameId: string;
  slot: 'hp' | 'shield' | 'special' | 'passive' | 'normal';
  position: 0 | 1;
  card: Card;
  timestamp: string;
}
```

**Example:**
```javascript
socket.on('card:equipped', ({ slot, position, card }) => {
  gameStore.equipCard(slot, position, card);
  showNotification(`${card.name} equipped to ${slot} slot`);
});
```

---

### `card:unequipped`
**Direction:** Server → Client (Broadcast to game room)
**Description:** Card removed from slot

**Payload:**
```typescript
{
  gameId: string;
  slot: 'hp' | 'shield' | 'special' | 'passive' | 'normal';
  position: 0 | 1;
  card: Card;
  timestamp: string;
}
```

---

### `card:discarded`
**Direction:** Server → Client (Broadcast to game room)
**Description:** Card permanently discarded for slot upgrade

**Payload:**
```typescript
{
  gameId: string;
  cardId: string;
  slotType: 'hp' | 'shield' | 'special' | 'passive' | 'normal';
  slotUpgraded: boolean;
  timestamp: string;
}
```

**Example:**
```javascript
socket.on('card:discarded', ({ cardId, slotType, slotUpgraded }) => {
  gameStore.removeCard(cardId);

  if (slotUpgraded) {
    gameStore.upgradeSlot(slotType);
    showNotification(`${slotType} slot upgraded! Can now hold 2 cards.`);
  }
});
```

## Tavern Events

### `tavern:replenished`
**Direction:** Server → Client (Broadcast to game room)
**Description:** Tavern card pool updated (after card defeated)

**Payload:**
```typescript
{
  gameId: string;
  position: number; // 0-8
  newCard: TavernCard;
  timestamp: string;
}
```

**Example:**
```javascript
socket.on('tavern:replenished', ({ position, newCard }) => {
  tavernStore.replaceCard(position, newCard);
  showNotification('New card appeared in the tavern!');
});
```

## Victory/Defeat Events

### `game:victory`
**Direction:** Server → Client (Broadcast to game room)
**Description:** Boss defeated, game won

**Payload:**
```typescript
{
  gameId: string;
  finalStats: {
    totalTurns: number;
    cardsDefeated: number;
    cardsCollected: number;
    finalHp: number;
  };
  timestamp: string;
}
```

**Example:**
```javascript
socket.on('game:victory', ({ finalStats }) => {
  gameStore.endGame('victory', finalStats);
  router.push('/victory');
});
```

---

### `game:defeat`
**Direction:** Server → Client (Broadcast to game room)
**Description:** Player defeated, game lost

**Payload:**
```typescript
{
  gameId: string;
  reason: 'combat_death' | 'boss_defeat';
  finalStats: {
    totalTurns: number;
    cardsDefeated: number;
    cardsCollected: number;
  };
  timestamp: string;
}
```

## Connection Events (Built-in Socket.io)

### `connect`
**Direction:** Server → Client
**Description:** Socket connected successfully

**Example:**
```javascript
socket.on('connect', () => {
  console.log('Connected to server:', socket.id);

  // Authenticate immediately
  socket.emit('auth:authenticate', {
    token: localStorage.getItem('authToken')
  });
});
```

---

### `disconnect`
**Direction:** Server → Client
**Description:** Socket disconnected

**Payload:**
```typescript
reason: string; // 'io server disconnect', 'io client disconnect', 'ping timeout', 'transport close'
```

**Example:**
```javascript
socket.on('disconnect', (reason) => {
  console.warn('Disconnected:', reason);

  if (reason === 'io server disconnect') {
    // Server forced disconnect, don't reconnect
    showError('Disconnected by server');
  } else {
    // Network issue, will auto-reconnect
    showNotification('Connection lost, reconnecting...');
  }
});
```

---

### `reconnect`
**Direction:** Server → Client
**Description:** Successfully reconnected after disconnect

**Example:**
```javascript
socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);

  // Re-authenticate and rejoin game
  socket.emit('auth:authenticate', {
    token: localStorage.getItem('authToken')
  });

  const gameId = gameStore.getCurrentGameId();
  if (gameId) {
    socket.emit('game:join', { gameId });
  }
});
```

---

### `error`
**Direction:** Server → Client
**Description:** Socket connection error

**Example:**
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

## Client Implementation Example

### React + Zustand Integration

```typescript
// hooks/useWebSocket.ts
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/stores/gameStore';

let socket: Socket | null = null;

export function useWebSocket(token: string) {
  const gameStore = useGameStore();

  useEffect(() => {
    if (!token || socket?.connected) return;

    // Initialize socket
    socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
    });

    // Authentication
    socket.on('auth:authenticated', ({ playerId }) => {
      console.log('Authenticated:', playerId);
    });

    socket.on('auth:error', ({ code, message }) => {
      console.error('Auth error:', code, message);
      // Handle token refresh or redirect to login
    });

    // Game state
    socket.on('game:state', ({ game }) => {
      gameStore.setGameState(game);
    });

    socket.on('game:state:updated', ({ updates }) => {
      gameStore.mergeUpdates(updates);
    });

    // Combat events
    socket.on('combat:initiated', ({ combat }) => {
      gameStore.startCombat(combat);
    });

    socket.on('combat:turn:executed', ({ events, playerStats, enemyStats, status }) => {
      gameStore.updateCombat({ events, playerStats, enemyStats, status });
    });

    socket.on('combat:ended', ({ outcome, rewards }) => {
      gameStore.endCombat(outcome, rewards);
    });

    // Card events
    socket.on('card:equipped', ({ slot, position, card }) => {
      gameStore.equipCard(slot, position, card);
    });

    socket.on('card:unequipped', ({ slot, position }) => {
      gameStore.unequipCard(slot, position);
    });

    socket.on('card:discarded', ({ cardId, slotType, slotUpgraded }) => {
      gameStore.discardCard(cardId);
      if (slotUpgraded) gameStore.upgradeSlot(slotType);
    });

    // Tavern events
    socket.on('tavern:replenished', ({ position, newCard }) => {
      gameStore.updateTavernCard(position, newCard);
    });

    // Victory/Defeat
    socket.on('game:victory', ({ finalStats }) => {
      gameStore.setGameOutcome('victory', finalStats);
    });

    socket.on('game:defeat', ({ finalStats }) => {
      gameStore.setGameOutcome('defeat', finalStats);
    });

    // Connection events
    socket.on('disconnect', (reason) => {
      console.warn('Disconnected:', reason);
      gameStore.setConnectionStatus('disconnected');
    });

    socket.on('reconnect', () => {
      console.log('Reconnected');
      gameStore.setConnectionStatus('connected');

      // Rejoin game room
      const gameId = gameStore.currentGameId;
      if (gameId) {
        socket?.emit('game:join', { gameId });
      }
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [token]);

  return socket;
}
```

### Joining a Game

```typescript
// components/GameLoader.tsx
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect } from 'react';

export function GameLoader({ gameId }: { gameId: string }) {
  const socket = useWebSocket(authToken);

  useEffect(() => {
    if (socket?.connected) {
      socket.emit('game:join', { gameId });
    }
  }, [socket, gameId]);

  return <div>Loading game...</div>;
}
```

## Server Implementation Example

### Socket.io Server Setup

```typescript
// server/websocket.ts
import { Server } from 'socket.io';
import { verifyJWT } from './auth';
import { GameService } from './services/GameService';

export function setupWebSocket(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const payload = await verifyJWT(token);
      socket.data.playerId = payload.sub;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id, socket.data.playerId);

    // Authentication events
    socket.on('auth:authenticate', async ({ token }) => {
      try {
        const payload = await verifyJWT(token);
        socket.data.playerId = payload.sub;

        socket.emit('auth:authenticated', {
          playerId: payload.sub,
          expiresAt: new Date(payload.exp * 1000).toISOString(),
        });
      } catch (error) {
        socket.emit('auth:error', {
          code: 'INVALID_TOKEN',
          message: 'Token is invalid or expired',
        });
      }
    });

    // Game room events
    socket.on('game:join', async ({ gameId }) => {
      try {
        const game = await GameService.getGame(gameId);

        // Verify player owns this game
        if (game.playerId !== socket.data.playerId) {
          socket.emit('game:error', {
            code: 'FORBIDDEN',
            message: 'You do not have access to this game',
          });
          return;
        }

        // Join room
        socket.join(`game:${gameId}`);

        socket.emit('game:joined', { gameId, roomId: `game:${gameId}` });
        socket.emit('game:state', {
          game,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        socket.emit('game:error', {
          code: 'GAME_NOT_FOUND',
          message: 'Game not found',
        });
      }
    });

    socket.on('game:leave', ({ gameId }) => {
      socket.leave(`game:${gameId}`);
      socket.emit('game:left', { gameId });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
```

### Broadcasting State Changes

```typescript
// services/GameService.ts
import { io } from './websocket';

class GameService {
  async equipCard(gameId: string, cardId: string, slot: string) {
    // ... business logic ...

    const updatedGame = await this.updateGame(gameId, updates);

    // Broadcast to all clients in game room
    io.to(`game:${gameId}`).emit('card:equipped', {
      gameId,
      slot,
      position: 0,
      card: equippedCard,
      timestamp: new Date().toISOString(),
    });

    io.to(`game:${gameId}`).emit('game:state:updated', {
      gameId,
      updates: {
        equippedSlots: updatedGame.equippedSlots,
        reserveCards: updatedGame.reserveCards,
      },
      timestamp: new Date().toISOString(),
    });

    return updatedGame;
  }
}
```

## Event Flow Examples

### Example 1: Starting Combat

```
Client                              Server                            Database
  │                                   │                                   │
  │ POST /api/v1/games/123/combat     │                                   │
  ├──────────────────────────────────→│                                   │
  │                                   │ Validate game state               │
  │                                   │ Calculate player stats            │
  │                                   │ Initialize combat                 │
  │                                   ├──────────────────────────────────→│
  │                                   │                Save combat state  │
  │                                   │←──────────────────────────────────┤
  │                                   │                                   │
  │ 201 Created (combat state)        │                                   │
  │←──────────────────────────────────┤                                   │
  │                                   │                                   │
  │ WS: combat:initiated              │                                   │
  │←──────────────────────────────────┤ (broadcast to game room)          │
  │                                   │                                   │
  │ WS: game:state:updated            │                                   │
  │←──────────────────────────────────┤                                   │
  │                                   │                                   │
```

### Example 2: Combat Turn with Optimistic UI

```
Client                              Server
  │                                   │
  │ 1. User clicks "Attack"           │
  │ 2. Optimistic UI update           │
  │    (show attack animation)        │
  │                                   │
  │ POST /api/v1/games/123/combat/attack
  ├──────────────────────────────────→│
  │                                   │ 3. Execute combat logic
  │                                   │ 4. Calculate damage
  │                                   │ 5. Process retaliation
  │                                   │
  │ 200 OK (combat result)            │
  │←──────────────────────────────────┤
  │                                   │
  │ WS: combat:turn:executed          │
  │←──────────────────────────────────┤
  │                                   │
  │ 6. Reconcile with server state    │
  │    (if different from optimistic) │
  │                                   │
```

## Rate Limiting

WebSocket events are rate-limited to prevent abuse:

**Per Socket:**
- `combat:attack`: Max 10/minute (prevent spam clicking)
- `card:equip`: Max 20/minute
- `game:join`: Max 5/minute

**Implementation:**
```typescript
const rateLimit = new Map<string, number[]>();

socket.on('combat:attack', async ({ gameId }) => {
  const key = `${socket.id}:combat:attack`;
  const now = Date.now();
  const timestamps = rateLimit.get(key) || [];

  // Remove timestamps older than 1 minute
  const recent = timestamps.filter(t => now - t < 60000);

  if (recent.length >= 10) {
    socket.emit('error', {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many combat actions, please wait',
    });
    return;
  }

  recent.push(now);
  rateLimit.set(key, recent);

  // Process action...
});
```

## Error Handling

All WebSocket errors follow this format:

```typescript
socket.emit('error', {
  code: 'ERROR_CODE',
  message: 'Human-readable error message',
  details?: Record<string, any>
});
```

**Common Error Codes:**
- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Valid auth but insufficient permissions
- `GAME_NOT_FOUND` - Game doesn't exist
- `INVALID_STATE` - Operation not allowed in current game state
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

## Future Enhancements (Post-MVP)

### Multiplayer Events
```typescript
// Matchmaking
socket.emit('matchmaking:queue', { mode: 'pvp' });
socket.on('matchmaking:matched', { opponentId, gameId });

// PvP Combat
socket.on('pvp:opponent:action', { action, timestamp });
socket.on('pvp:turn:change', { currentPlayer });

// Spectator
socket.emit('spectate:join', { gameId });
socket.on('spectate:state', { game, timestamp });
```

### Performance Monitoring
```typescript
// Client-side latency tracking
socket.on('pong', (latency) => {
  console.log('Latency:', latency, 'ms');
});

// Server-side metrics
socket.emit('metrics:track', {
  event: 'combat:turn',
  duration: 250,
  timestamp: Date.now()
});
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-15
**Status:** MVP WebSocket Specification
