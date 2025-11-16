# Tavern Card Game - Backend Quick Reference

## Technology Stack

```
Backend:        Node.js 20 LTS + Express 4.x + Socket.io 4.x
Database:       SQLite (dev) → PostgreSQL 15+ (prod)
Query Builder:  Knex.js
Caching:        Redis 7.x
Authentication: JWT (jsonwebtoken)
Validation:     Zod
Logging:        Winston + Morgan
Testing:        Jest + Supertest
Deployment:     Railway (backend + database + Redis)
Frontend:       React + Vite + Zustand (separate deployment on Vercel)
```

## Service Summary

| Service | Responsibilities | Key Operations |
|---------|-----------------|----------------|
| **Auth Service** | Guest sessions, JWT tokens | `createGuestSession()`, `verifyToken()` |
| **Game Service** | Game lifecycle, state management | `createGame()`, `loadGame()`, `updateGame()` |
| **Card Service** | Card catalog, inventory, tavern | `equipCard()`, `discardCard()`, `replenishTavern()` |
| **Combat Service** | Turn-based combat, damage calculation | `initiateCombat()`, `executeTurn()`, `resolveRetaliation()` |

## API Endpoints Summary

### Authentication
```
POST   /api/v1/auth/guest           # Create guest session (no auth)
GET    /api/v1/auth/session         # Validate current session
```

### Games
```
POST   /api/v1/games                # Create new game
GET    /api/v1/games                # List player's games
GET    /api/v1/games/{id}           # Get game state
DELETE /api/v1/games/{id}           # Abandon game
```

### Cards
```
GET    /api/v1/cards                # Get all cards (cached)
GET    /api/v1/cards/{id}           # Get card details
GET    /api/v1/games/{id}/inventory # Get player inventory
POST   /api/v1/games/{id}/cards/equip   # Equip card
POST   /api/v1/games/{id}/cards/unequip # Unequip card
POST   /api/v1/games/{id}/cards/discard # Discard card (upgrade slot)
```

### Tavern
```
GET    /api/v1/games/{id}/tavern    # Get tavern cards (9 cards)
```

### Combat
```
POST   /api/v1/games/{id}/combat         # Initiate combat
GET    /api/v1/games/{id}/combat         # Get active combat
POST   /api/v1/games/{id}/combat/attack  # Execute attack turn
POST   /api/v1/games/{id}/combat/end     # End combat (forfeit)
```

### Health
```
GET    /health/live                 # Liveness probe
GET    /health/ready                # Readiness probe
GET    /health/status               # Detailed health status
```

## WebSocket Events Summary

### Connection & Authentication
```javascript
connect                    // Connection established
auth:authenticate          // Client → Server (authenticate)
auth:authenticated         // Server → Client (success)
auth:error                 // Server → Client (failure)
disconnect                 // Connection lost
reconnect                  // Reconnected successfully
```

### Game State
```javascript
game:join                  // Client → Server (join game room)
game:joined                // Server → Client (joined successfully)
game:leave                 // Client → Server (leave game room)
game:state                 // Server → Client (full state)
game:state:updated         // Server → Client (delta update)
game:error                 // Server → Client (error)
```

### Combat
```javascript
combat:initiated           // Server → Client (combat started)
combat:turn:executed       // Server → Client (turn completed)
combat:ended               // Server → Client (combat finished)
```

### Cards & Tavern
```javascript
card:equipped              // Server → Client (card equipped)
card:unequipped            // Server → Client (card removed)
card:discarded             // Server → Client (card discarded)
tavern:replenished         // Server → Client (new tavern card)
```

### Victory & Defeat
```javascript
game:victory               // Server → Client (boss defeated)
game:defeat                // Server → Client (player defeated)
```

## Caching Strategy

| Cache Type | Key Pattern | TTL | Pattern | Use Case |
|------------|-------------|-----|---------|----------|
| **Card Catalog** | `cards:all`, `card:{id}` | No expiration | Cache-Aside | Static card database |
| **Game State** | `game:{gameId}` | 1 hour (sliding) | Write-Through | Active game sessions |
| **Session** | `session:{playerId}` | 24 hours | Write-Through | Player sessions |

## Error Codes

### Client Errors (4xx)
```
BAD_REQUEST (400)              - Invalid input, validation failure
UNAUTHORIZED (401)             - Missing or invalid token
FORBIDDEN (403)                - Valid token, wrong player
NOT_FOUND (404)                - Game/card not found
CONFLICT (409)                 - Invalid state transition
VALIDATION_ERROR (422)         - Business logic violation
```

### Server Errors (5xx)
```
INTERNAL_SERVER_ERROR (500)    - Unexpected error
SERVICE_UNAVAILABLE (503)      - Database/cache unavailable
```

### Game-Specific Errors
```
GAME_NOT_FOUND                 - Game doesn't exist
GAME_ALREADY_ENDED             - Cannot modify completed game
INVALID_GAME_PHASE             - Operation not allowed in current phase
CARD_NOT_FOUND                 - Card doesn't exist
SLOT_OCCUPIED                  - Cannot equip to full slot
SLOT_NOT_UPGRADED              - Dual slot requires upgrade
CARD_NOT_OWNED                 - Card not in inventory
INVALID_SLOT                   - Invalid slot name
NO_ACTIVE_COMBAT               - Combat operation requires active combat
COMBAT_ALREADY_ACTIVE          - Cannot start combat during combat
INVALID_TARGET                 - Target not in tavern
```

## Database Tables (Overview)

```
games
├── game_id (PK)
├── player_id (FK)
├── status (active/completed/abandoned)
├── current_turn
├── phase (tavern/combat/management/victory/defeat)
├── slot_upgrades (JSON)
├── active_combat (JSON, nullable)
├── boss_defeated
└── timestamps

players
├── player_id (PK)
└── timestamps

cards
├── card_id (PK)
├── name
├── description
├── hp
├── shield
├── abilities (JSON)
├── is_boss
└── rarity

equipped_cards
├── game_id (FK)
├── card_id (FK)
├── slot (hp/shield/special/passive/normal)
└── position (0 or 1)

reserve_cards
├── game_id (FK)
└── card_id (FK)

tavern_cards
├── game_id (FK)
├── position (0-8)
├── card_id (FK)
└── current_hp
```

## Request Flow (Typical)

```
1. Client creates guest session
   POST /api/v1/auth/guest
   → Returns: {playerId, token, expiresAt}

2. Client connects WebSocket with token
   socket.io connect with auth: {token}
   → Emits: auth:authenticated

3. Client creates new game
   POST /api/v1/games (with Bearer token)
   → Returns: Full game state

4. Client joins game room via WebSocket
   Emit: game:join {gameId}
   → Receives: game:joined, game:state

5. Client initiates combat
   POST /api/v1/games/{id}/combat {targetCardId}
   → Returns: Combat state
   → WebSocket broadcasts: combat:initiated

6. Client executes attack
   POST /api/v1/games/{id}/combat/attack
   → Returns: Combat result
   → WebSocket broadcasts: combat:turn:executed

7. Combat ends (victory)
   → WebSocket broadcasts: combat:ended
   → WebSocket broadcasts: tavern:replenished
   → WebSocket broadcasts: game:state:updated

8. Boss defeated
   → WebSocket broadcasts: game:victory
```

## Environment Variables

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
REDIS_TTL_SESSION=86400      # 24 hours
REDIS_TTL_GAME=3600          # 1 hour

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# CORS
FRONTEND_URL=https://tavern-game.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## Combat Mechanics (Quick Reference)

### Turn Flow
```
1. Player attacks with total attack power
2. Enemy shield absorbs damage
3. Remaining damage → enemy HP
4. If enemy alive:
   a. Enemy retaliates with ALL abilities
   b. Damage applied to player HP
   c. Enemy shield regenerates to full
5. If enemy HP ≤ 0:
   → Victory: Add card to reserve, replenish tavern
6. If player HP ≤ 0:
   → Defeat: Game over
```

### Damage Calculation
```
Enemy Damage = max(0, Player Attack Power - Enemy Shield)
Player Damage = sum(All Enemy Abilities)  // Only if enemy alive
```

### Shield Mechanics
- Regenerates to full after each attack
- Absorbs damage before HP
- Dead cards don't retaliate (shield doesn't matter)

### Card Acquisition
- Defeat card in combat → Add to reserve
- Tavern position automatically replenished with new random card

## Slot Mechanics

### Slot Types
```
HP       - Increases total HP
Shield   - Increases total shield
Special  - ⭐ Special ability
Passive  - 🎖️ Passive ability
Normal   - ⬡ Normal ability
```

### Slot Upgrades
- Default: 1 card per slot
- Upgraded: 2 cards per slot
- Upgrade method: Discard any card of matching type
- Irreversible action

## Rate Limits

```
Global API:        100 requests/minute per IP
Per Session:       50 requests/minute
Combat Actions:    10 requests/minute
WebSocket Events:  Same as combat (10/minute for combat events)
```

## Health Check Endpoints

```
/health/live
→ 200: {"status": "alive"}
→ Used by: Load balancer liveness probe

/health/ready
→ 200: {"status": "ready", "checks": {"db": "ok", "cache": "ok"}}
→ 503: {"status": "not_ready", "checks": {...}}
→ Used by: Deployment readiness checks

/health/status
→ 200: {
    "status": "healthy",
    "uptime": 3600,
    "database": {"status": "ok", "latency": "5ms"},
    "cache": {"status": "ok", "hitRate": "95%"},
    "websockets": {"connections": 42}
  }
→ Used by: Monitoring dashboards
```

## Middleware Pipeline

```
Request
  ↓
helmet() (security headers)
  ↓
cors() (CORS configuration)
  ↓
express.json() (body parsing)
  ↓
requestId() (correlation ID)
  ↓
morgan() (HTTP logging)
  ↓
rateLimiter() (rate limiting)
  ↓
authenticate() (JWT verification)
  ↓
validate() (Zod schema validation)
  ↓
Route Handler
  ↓
errorHandler() (error formatting)
  ↓
Response
```

## Testing Commands

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- GameService.test.ts

# E2E tests (with test database)
npm run test:e2e
```

## Common Development Tasks

```bash
# Start development server
npm run dev

# Database migrations
npm run migrate:latest       # Run all migrations
npm run migrate:rollback     # Rollback last batch
npm run migrate:make <name>  # Create new migration

# Database seeding
npm run seed:run            # Run all seeds
npm run seed:make <name>    # Create new seed

# Code quality
npm run lint                # Check linting
npm run lint:fix            # Fix linting issues
npm run format              # Format with Prettier
npm run type-check          # TypeScript type checking

# Production build
npm run build               # Compile TypeScript
npm start                   # Run production server
```

## File Structure

```
src/
├── config/
│   ├── database.ts         # Knex configuration
│   ├── redis.ts            # Redis configuration
│   └── logger.ts           # Winston configuration
├── errors/
│   └── AppError.ts         # Error classes
├── middleware/
│   ├── auth.ts             # Authentication middleware
│   ├── errorHandler.ts     # Error handling
│   ├── rateLimiter.ts      # Rate limiting
│   ├── requestId.ts        # Request ID generation
│   └── validation.ts       # Zod validation
├── repositories/
│   ├── GameRepository.ts   # Game data access
│   ├── CardRepository.ts   # Card data access
│   └── PlayerRepository.ts # Player data access
├── routes/
│   ├── auth.ts             # Auth routes
│   ├── games.ts            # Game routes
│   ├── cards.ts            # Card routes
│   ├── combat.ts           # Combat routes
│   └── health.ts           # Health routes
├── services/
│   ├── AuthService.ts      # Authentication logic
│   ├── GameService.ts      # Game logic
│   ├── CardService.ts      # Card logic
│   └── CombatService.ts    # Combat logic
├── types/
│   ├── Game.ts             # Game types
│   ├── Card.ts             # Card types
│   └── Combat.ts           # Combat types
├── utils/
│   ├── cache.ts            # Cache helpers
│   └── retry.ts            # Retry logic
├── websocket/
│   ├── index.ts            # Socket.io setup
│   ├── auth.ts             # WebSocket auth
│   └── events.ts           # Event handlers
├── server.ts               # Express app setup
└── index.ts                # Entry point

migrations/
seeds/
tests/
docs/
```

## Key Architectural Principles

1. **Separation of Concerns**: Services, repositories, routes clearly separated
2. **Dependency Injection**: Services receive dependencies via constructor
3. **Repository Pattern**: Database abstraction for testability
4. **Error Handling**: Centralized error handling with custom error classes
5. **Caching**: Multi-layer caching with fallback to database
6. **Real-time Updates**: WebSocket broadcasts for state changes
7. **Idempotency**: Combat actions use idempotency keys
8. **Observability**: Structured logging with correlation IDs
9. **Security**: JWT auth, rate limiting, input validation
10. **Scalability**: Stateless design, horizontal scaling ready

---

**Quick Reference Version:** 1.0
**Last Updated:** 2025-11-15
**For Full Details:** See individual documentation files in `/docs`
