# Tavern Card Game - Backend Architecture

## Service Architecture Overview

### Architecture Style
**Modular Monolith with Real-time Communication**
- Single Node.js service with clear internal module boundaries
- REST API for command operations (state changes)
- WebSocket for real-time game state updates
- Future-ready for microservices extraction (multiplayer, matchmaking)

### Service Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                            │
│  ┌──────────────────┐         ┌───────────────────────┐        │
│  │   REST API       │         │   WebSocket Server    │        │
│  │  (Express)       │         │   (Socket.io)         │        │
│  └──────────────────┘         └───────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     Service Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Game Service │  │ Card Service │  │ Combat       │         │
│  │              │  │              │  │ Service      │         │
│  │ - Session    │  │ - Card CRUD  │  │              │         │
│  │ - State mgmt │  │ - Equip logic│  │ - Turn logic │         │
│  │ - Progress   │  │ - Tavern     │  │ - Damage calc│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     Data Access Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Game Repo    │  │ Card Repo    │  │ Player Repo  │         │
│  │              │  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     Persistence Layer                            │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ SQLite/      │  │ Redis Cache  │                            │
│  │ PostgreSQL   │  │ (Session &   │                            │
│  │              │  │  Card Data)  │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Core Services

### 1. Game Service
**Responsibilities:**
- Game lifecycle management (create, load, update)
- Player inventory management (equip, unequip, discard)
- Game state caching (Redis)
- Turn and phase management

**Key Operations:**
- `createGame(playerId)` - Initialize new game session
- `getGame(gameId)` - Retrieve current state (with caching)
- `getPlayerGames(playerId)` - Get all games for player
- `equipCard(gameId, cardId, slot)` - Equip card to slot
- `unequipCard(gameId, cardId)` - Remove equipped card
- `discardCard(gameId, cardId)` - Discard for slot upgrade
- `updateGamePhase(gameId, phase)` - Change game phase
- `advanceTurn(gameId)` - Increment turn counter
- `updatePlayerHP(gameId, hp)` - Update player health
- `replenishTavern(gameId)` - Refill empty tavern slots
- `cacheGameState(game)` - Cache game in Redis
- `clearGameCache(gameId)` - Invalidate cache

**Source:** `src/services/GameService.js`

### 2. Card Service (Card Catalog Management)
**Responsibilities:**
- Card database/catalog management
- Card queries by rarity, type, boss status
- Random card generation for tavern
- Card data caching

**Key Operations:**
- `getAllCards()` - Fetch all cards from catalog
- `getCardById(id)` - Fetch single card details
- `getCardsByRarity(rarity)` - Filter cards by rarity
- `getRegularCards()` - Get non-boss cards
- `getBossCards()` - Get boss cards only
- `getRandomCards(count, excludeIds)` - Generate random selection
- `warmCache()` - Preload card cache on startup
- `clearCache()` - Invalidate card cache

**Note:** Card inventory operations (equip/unequip/discard) are in **GameService**, NOT CardService.

**Source:** `src/services/CardService.js`

### 3. Combat Service
**Responsibilities:**
- Turn-based combat resolution (single-turn attacks)
- Attack damage calculation
- Shield mechanics and blocking
- Retaliation with ability system
- Combat logging

**Key Operations:**
- `attackTavernCard(gameId, targetCardId)` - Execute full combat turn
- `calculatePlayerAttack(game)` - Sum equipped HP cards
- `calculatePlayerShield(game)` - Sum equipped shield cards
- `calculateDamage(attackPower, targetShield)` - Damage after shield
- `performRetaliation(game, attackerCard, combatLog)` - Enemy counterattack
- `applyAbility(ability, game, combatLog, sourceName, sourceCard)` - Execute ability effects

**Note:** Combat is atomic (single REST call or socket event), not turn-by-turn.

**Source:** `src/services/CombatService.js`

### 4. Authentication Service
**Responsibilities:**
- Guest session creation (no registration required)
- JWT token generation and validation
- Session management (Redis + database)
- Session cleanup

**Key Operations:**
- `createGuestSession()` - Create anonymous player session with JWT
- `validateToken(token)` - Verify JWT and session validity
- `revokeSession(token)` - Invalidate session
- `cleanExpiredSessions()` - Remove expired sessions from DB

**Note:** Token refresh NOT supported in MVP (24h expiration, create new session).

**Source:** `src/services/AuthService.js`

## API Architecture

### REST API Design Principles
- **Resource-oriented**: `/games`, `/cards`, `/combat`
- **Stateless operations**: Each request contains full context
- **Idempotent operations**: Safe retries for game actions
- **Version prefix**: `/api/v1/*`
- **JSON payloads**: Standard request/response format

### WebSocket Event Design Principles
- **Event-driven updates**: Push state changes to client
- **Room-based**: One room per game session
- **Optimistic UI support**: Action acknowledgment + state broadcast
- **Reconnection handling**: Resume game state on reconnect

## State Management Strategy

### Session State (Redis Cache)
```
Session Key: session:{sessionToken}
TTL: 24 hours
Data: {
  playerId: string
  createdAt: timestamp
  expiresAt: timestamp
}
```

### Game State (In-Memory + DB)
```
Game Key: game:{gameId}
Data: {
  gameId: string
  playerId: string
  status: "active" | "completed" | "abandoned"
  currentTurn: number
  phase: "tavern" | "combat" | "management" | "victory" | "defeat"
  equippedSlots: {
    hp: [Card] | [Card, Card]
    shield: [Card] | [Card, Card]
    special: [Card] | [Card, Card]
    passive: [Card] | [Card, Card]
    normal: [Card] | [Card, Card]
  }
  slotUpgrades: {
    hp: boolean
    shield: boolean
    special: boolean
    passive: boolean
    normal: boolean
  }
  reserveCards: Card[]
  tavernCards: Card[9]
  activeCombat: CombatState | null
  bossDefeated: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Combat State
```
Combat: {
  combatId: string
  gameId: string
  targetCard: Card
  targetCurrentHp: number
  turn: number
  playerStats: {
    totalHp: number
    currentHp: number
    totalShield: number
    currentShield: number
    attackPower: number
    abilities: Ability[]
  }
  combatLog: CombatEvent[]
  status: "active" | "victory" | "defeat"
}
```

## Data Flow Patterns

### Command Flow (REST → WebSocket Broadcast)
```
1. Client sends REST POST /api/v1/games/{gameId}/combat
2. Combat Service validates and executes combat logic
3. Game state updated in database
4. WebSocket broadcasts state change to game room
5. REST response returns combat result
6. Client receives both REST response + WebSocket update
```

### Query Flow (REST Only)
```
1. Client sends REST GET /api/v1/games/{gameId}
2. Game Service retrieves from cache or database
3. REST response returns current state
```

### Real-time Update Flow (WebSocket Push)
```
1. Game state changes (via any operation)
2. Event emitted to game:{gameId} room
3. Connected clients receive state update
4. Client reconciles with local state
```

## Caching Strategy

### Cache Layers

#### 1. Card Catalog Cache (Redis)
```
Key Pattern: cards:all, cards:rarity:{rarity}, cards:{id}
TTL: 1 hour (3600 seconds)
Strategy: Cache-Aside
Data: Card definitions with abilities
Invalidation: Auto-expiration (cards rarely change)
```

**Source:** `src/constants/game.js:61` - `CACHE_TTL.CARDS`

#### 2. Game State Cache (Redis)
```
Key Pattern: game:{gameId}
TTL: 5 minutes (300 seconds)
Strategy: Write-Through
Data: Complete game state with equipped cards, tavern, player stats
Invalidation: Auto-expiration + explicit clearGameCache()
```

**Source:** `src/constants/game.js:60` - `CACHE_TTL.GAME`

#### 3. Session Cache (Redis)
```
Key Pattern: session:{token}
TTL: 24 hours (86400 seconds)
Strategy: Write-Through
Data: Player ID, guest ID, creation timestamp
Invalidation: Logout or expiration
```

**Source:** `src/constants/game.js:62` - `CACHE_TTL.SESSION`

**Note:** Player inventory cache does NOT exist as separate entity. Inventory is part of game state cache.

### Cache Patterns

**Cache-Aside (Lazy Loading)**
- Used for card database
- Read: Check cache → miss → DB → populate cache
- Write: Update DB → invalidate cache

**Write-Through**
- Used for game state
- Write: Update cache + DB simultaneously
- Ensures consistency for active games

**Cache Warming**
- Preload card database on server startup
- No warming for game state (on-demand only)

## Authentication & Security

### MVP Authentication Strategy

**Guest-Based Sessions (No Registration Required)**
```
1. Client requests guest session: POST /api/v1/auth/guest
2. Server generates session token (JWT)
3. Client stores token (localStorage)
4. All subsequent requests include: Authorization: Bearer {token}
5. Token expires after 24 hours
```

**JWT Claims:**
```json
{
  "sub": "player_uuid",
  "type": "guest",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Security Patterns

**Rate Limiting**
- Per-IP: 100 requests/minute
- Per-session: 50 requests/minute
- Combat actions: 10/minute (prevent spam)

**Input Validation**
- JSON schema validation on all endpoints
- Card ID validation (exists in database)
- Slot validation (valid slot names)
- Game state validation (valid phase transitions)

**CORS Configuration**
```javascript
{
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}
```

## Error Handling Standards

### Error Response Format
```json
{
  "error": {
    "code": "INVALID_CARD_OPERATION",
    "message": "Cannot equip card to slot: slot already occupied",
    "details": {
      "slot": "hp",
      "currentCard": "card_123",
      "attemptedCard": "card_456"
    },
    "timestamp": "2025-11-15T01:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error Categories

**Client Errors (4xx)**
- `400 BAD_REQUEST` - Invalid input, validation failure
- `401 UNAUTHORIZED` - Missing or invalid session token
- `403 FORBIDDEN` - Valid token, invalid operation (wrong player)
- `404 NOT_FOUND` - Game/card/resource not found
- `409 CONFLICT` - Invalid state transition
- `422 UNPROCESSABLE_ENTITY` - Business logic violation

**Server Errors (5xx)**
- `500 INTERNAL_SERVER_ERROR` - Unexpected error
- `503 SERVICE_UNAVAILABLE` - Database/cache unavailable

### Error Codes

**Game Errors**
- `GAME_NOT_FOUND` - Game ID doesn't exist
- `GAME_ALREADY_ENDED` - Cannot modify completed game
- `INVALID_GAME_PHASE` - Operation not allowed in current phase

**Card Errors**
- `CARD_NOT_FOUND` - Card ID doesn't exist
- `SLOT_OCCUPIED` - Cannot equip to occupied slot
- `SLOT_NOT_UPGRADED` - Dual slot requires upgrade
- `CARD_NOT_OWNED` - Card not in player inventory
- `INVALID_SLOT` - Slot name invalid

**Combat Errors**
- `NO_ACTIVE_COMBAT` - Combat operation requires active combat
- `COMBAT_ALREADY_ACTIVE` - Cannot start combat during combat
- `INVALID_TARGET` - Target card not in tavern

### Error Handling Patterns

**Graceful Degradation**
```javascript
// Cache failure → fallback to database
try {
  const gameState = await redis.get(`game:${gameId}`);
  if (!gameState) throw new CacheMissError();
  return JSON.parse(gameState);
} catch (error) {
  logger.warn('Cache miss, falling back to DB', { gameId, error });
  return await db.getGame(gameId);
}
```

**Circuit Breaker (External Services)**
```javascript
// Not needed for MVP (no external dependencies)
// Future: Multiplayer matchmaking, leaderboards
```

**Retry with Exponential Backoff**
```javascript
// Database operations (transient failures)
const result = await retry(
  () => db.updateGameState(gameId, state),
  { maxAttempts: 3, backoff: 'exponential' }
);
```

## Database Access Patterns

### Repository Pattern
```
GameRepository
├── create(gameData): Game
├── findById(gameId): Game | null
├── update(gameId, updates): Game
├── delete(gameId): void
└── findActiveByPlayerId(playerId): Game[]

CardRepository
├── findAll(): Card[]
├── findById(cardId): Card | null
├── findByIds(cardIds[]): Card[]
└── findByType(type): Card[]

PlayerRepository
├── create(): Player
├── findById(playerId): Player | null
└── update(playerId, updates): Player
```

### Transaction Patterns

**Combat Resolution (ACID Transaction)**
```sql
BEGIN TRANSACTION;
  -- Update enemy card HP
  UPDATE tavern_cards SET current_hp = ? WHERE game_id = ? AND card_id = ?;

  -- Update player HP (retaliation)
  UPDATE games SET player_current_hp = ? WHERE game_id = ?;

  -- If enemy defeated, add to inventory
  INSERT INTO player_cards (game_id, card_id, location) VALUES (?, ?, 'reserve');

  -- Replenish tavern
  UPDATE tavern_cards SET card_id = ? WHERE game_id = ? AND position = ?;

COMMIT;
```

**Optimistic Locking (Prevent Concurrent Modifications)**
```javascript
// Version-based concurrency control
const game = await db.getGame(gameId);
const updated = await db.update(gameId, {
  ...updates,
  version: game.version + 1
}, {
  where: { gameId, version: game.version }
});

if (!updated) {
  throw new ConflictError('Game state changed, retry operation');
}
```

### Query Optimization Patterns

**Eager Loading (Avoid N+1)**
```javascript
// Load game with all related cards in single query
const game = await db.getGame(gameId, {
  include: ['equippedCards', 'reserveCards', 'tavernCards']
});
```

**Projection (Select Only Needed Fields)**
```javascript
// Lightweight game list (exclude card details)
const games = await db.getActiveGames(playerId, {
  select: ['gameId', 'status', 'currentTurn', 'updatedAt']
});
```

## Resilience Patterns

### Idempotency
**Idempotent Operations:**
- All PUT/DELETE operations
- Combat resolution (idempotency key required)

**Implementation:**
```javascript
// Client sends idempotency key in header
POST /api/v1/games/{gameId}/combat
X-Idempotency-Key: uuid_v4

// Server checks if operation already processed
const existing = await redis.get(`idempotency:${idempotencyKey}`);
if (existing) return JSON.parse(existing); // Return cached result

// Process operation
const result = await combatService.execute(gameId, targetCardId);

// Cache result for 24 hours
await redis.setex(`idempotency:${idempotencyKey}`, 86400, JSON.stringify(result));
```

### Health Checks

**Liveness Probe**
```
GET /health/live
Response: 200 OK { "status": "alive" }
```

**Readiness Probe**
```
GET /health/ready
Checks:
- Database connection
- Redis connection
Response: 200 OK { "status": "ready", "checks": { "db": "ok", "cache": "ok" } }
```

**Deep Health Check**
```
GET /health/status
Checks:
- Database query latency
- Cache hit rate
- Active WebSocket connections
Response: 200 OK {
  "status": "healthy",
  "uptime": 3600,
  "database": { "status": "ok", "latency": "5ms" },
  "cache": { "status": "ok", "hitRate": "95%" },
  "websockets": { "connections": 42 }
}
```

## Observability

### Logging Strategy

**Structured Logging (JSON Format)**
```json
{
  "timestamp": "2025-11-15T01:00:00Z",
  "level": "info",
  "message": "Combat resolved",
  "context": {
    "gameId": "game_123",
    "playerId": "player_456",
    "combatId": "combat_789",
    "outcome": "victory",
    "duration": 1250
  },
  "requestId": "req_abc123"
}
```

**Log Levels:**
- `ERROR`: Unhandled exceptions, critical failures
- `WARN`: Handled errors, degraded performance, cache misses
- `INFO`: Business events (game created, combat resolved, victory)
- `DEBUG`: Detailed operation logs (development only)

**Correlation IDs:**
- Request ID: Unique per HTTP request
- Game ID: Track all operations for a game
- Player ID: Track player actions

### Metrics (Future: Prometheus)

**Application Metrics:**
- `games_created_total` - Counter
- `games_active` - Gauge
- `combat_duration_seconds` - Histogram
- `api_request_duration_seconds` - Histogram (by endpoint)
- `websocket_connections_active` - Gauge
- `cache_hits_total` / `cache_misses_total` - Counter

**Business Metrics:**
- `cards_equipped_total` (by slot type)
- `tavern_cards_defeated_total`
- `boss_victories_total`
- `player_deaths_total`

### Distributed Tracing (Future)
- OpenTelemetry instrumentation
- Trace ID propagation (REST → Service → DB)
- Span tracking for combat resolution flow

## Future Considerations (Post-MVP)

### Multiplayer Expansion
**Service Extraction:**
- Matchmaking Service (separate microservice)
- Player Service (authentication, profiles, friends)
- Leaderboard Service (rankings, statistics)

**Communication:**
- Service-to-service: gRPC (low latency)
- Event bus: Redis Pub/Sub or Kafka
- API Gateway: Kong or Traefik

### Advanced Features
**Persistent Player Accounts:**
- OAuth 2.0 integration (Google, Discord)
- Email/password authentication
- Account linking (guest → registered)

**Real-time Multiplayer:**
- PvP combat mechanics
- Spectator mode
- Tournament brackets

**Analytics & Monitoring:**
- Player behavior tracking
- A/B testing framework
- Performance monitoring (DataDog, New Relic)

**Scalability:**
- Horizontal scaling (stateless service design ready)
- Database sharding (by player region)
- WebSocket scaling (Socket.io Redis adapter)

## Technology Stack Summary

**Backend Framework:**
- Node.js 20 LTS
- Express 5.1.0 (REST API)
- Socket.io 4.8.1 (WebSocket real-time communication)
- Knex 3.1.0 (SQL query builder)

**Database:**
- SQLite3 (development)
- PostgreSQL 14+ (production)

**Caching:**
- Redis Server 7.x (caching server)
- redis 5.9.0 (npm client library for Redis)

**Authentication:**
- jsonwebtoken 9.0.2 (JWT authentication)

**Validation:**
- Zod 4.1.12 (schema validation)

**Security:**
- Helmet 8.1.0 (security headers)
- express-rate-limit 8.2.1 (rate limiting)

**Logging:**
- Winston 3.18.3 (structured logging)

**Testing:**
- Jest (unit tests)
- Supertest (API integration tests)
- Socket.io-client (WebSocket testing)

**Deployment:**
- Railway (backend + database + Redis)
- Docker (containerization)
- GitHub Actions (CI/CD)

## Configuration Management

**Environment Variables:**
```bash
# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:pass@host:5432/tavern
DB_POOL_MIN=2
DB_POOL_MAX=10

# Redis
REDIS_URL=redis://host:6379
REDIS_TTL_SESSION=86400
REDIS_TTL_GAME=3600

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# CORS
FRONTEND_URL=https://tavern-game.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

**Configuration Validation:**
- Validate all required env vars on startup
- Fail fast if misconfigured
- Use dotenv for local development

## Deployment Strategy

### MVP Deployment (Railway)
```
┌─────────────────────────────────────┐
│  Railway Project                     │
│  ├── Backend Service (Node.js)      │
│  ├── PostgreSQL Database            │
│  └── Redis Cache                    │
└─────────────────────────────────────┘
```

**Deployment Process:**
1. Push to `main` branch
2. GitHub Actions runs tests
3. Railway auto-deploys on success
4. Database migrations run automatically
5. Health checks confirm deployment

**Rollback Strategy:**
- Railway: Revert to previous deployment
- Database: Maintain migration versioning
- Zero-downtime: Not critical for MVP (single-player)

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
1. Lint & Type Check
2. Run Unit Tests
3. Run Integration Tests
4. Build Docker Image
5. Push to Registry (if main branch)
6. Deploy to Railway (automatic)
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-15
**Status:** MVP Architecture Design
