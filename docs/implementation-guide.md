# Tavern Card Game - Implementation Guide

This guide provides complete implementation patterns for authentication, caching, error handling, and database access. Use these as reference implementations when building the backend service.

## Table of Contents
1. [Authentication & Session Management](#authentication--session-management)
2. [Caching Strategy & Implementation](#caching-strategy--implementation)
3. [Error Handling Standards](#error-handling-standards)
4. [Database Access Patterns](#database-access-patterns)
5. [Middleware & Request Pipeline](#middleware--request-pipeline)

---

## Authentication & Session Management

### JWT-Based Guest Authentication

#### Overview
The MVP uses JWT tokens for guest sessions without requiring user registration. Players can start playing immediately.

#### Token Structure

```typescript
// JWT Claims
interface TokenPayload {
  sub: string;        // Player ID (UUID)
  type: 'guest';      // Auth type (future: 'registered')
  iat: number;        // Issued at (Unix timestamp)
  exp: number;        // Expires at (Unix timestamp)
}
```

#### Implementation

**1. Token Generation**

```typescript
// services/AuthService.ts
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly JWT_EXPIRES_IN = '24h';

  async createGuestSession(): Promise<{
    playerId: string;
    token: string;
    expiresAt: string;
  }> {
    const playerId = `player_${uuidv4()}`;

    const token = jwt.sign(
      {
        sub: playerId,
        type: 'guest',
      },
      this.JWT_SECRET,
      {
        expiresIn: this.JWT_EXPIRES_IN,
      }
    );

    const decoded = jwt.decode(token) as jwt.JwtPayload;
    const expiresAt = new Date(decoded.exp! * 1000).toISOString();

    // Store session in Redis for quick validation
    await this.storeSession(playerId, token, decoded.exp!);

    return {
      playerId,
      token,
      expiresAt,
    };
  }

  private async storeSession(
    playerId: string,
    token: string,
    expiresAt: number
  ): Promise<void> {
    const redis = getRedisClient();
    const sessionKey = `session:${playerId}`;
    const ttl = expiresAt - Math.floor(Date.now() / 1000);

    await redis.setex(
      sessionKey,
      ttl,
      JSON.stringify({
        playerId,
        token,
        createdAt: new Date().toISOString(),
      })
    );
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as TokenPayload;

      // Optional: Check if session exists in Redis
      const sessionExists = await this.validateSession(payload.sub);
      if (!sessionExists) {
        throw new Error('Session not found or expired');
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired', 'TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token', 'INVALID_TOKEN');
      }
      throw error;
    }
  }

  private async validateSession(playerId: string): Promise<boolean> {
    const redis = getRedisClient();
    const session = await redis.get(`session:${playerId}`);
    return session !== null;
  }

  async refreshSession(playerId: string): Promise<string> {
    // For future: Implement token refresh with refresh tokens
    // MVP: Client requests new token via /auth/guest
    throw new Error('Refresh not implemented in MVP');
  }

  async revokeSession(playerId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`session:${playerId}`);
  }
}
```

**2. Authentication Middleware**

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      playerId?: string;
      tokenPayload?: TokenPayload;
    }
  }
}

const authService = new AuthService();

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError(
        'Missing authorization header',
        'MISSING_TOKEN'
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    const payload = await authService.verifyToken(token);

    // Attach to request
    req.playerId = payload.sub;
    req.tokenPayload = payload;

    next();
  } catch (error) {
    next(error); // Pass to error handler
  }
}

// Optional middleware (allow anonymous access)
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await authService.verifyToken(token);
      req.playerId = payload.sub;
      req.tokenPayload = payload;
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}
```

**3. Route Integration**

```typescript
// routes/auth.ts
import { Router } from 'express';
import { AuthService } from '../services/AuthService';

const router = Router();
const authService = new AuthService();

// Create guest session (no auth required)
router.post('/guest', async (req, res, next) => {
  try {
    const session = await authService.createGuestSession();
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// Validate current session (auth required)
router.get('/session', authenticate, async (req, res) => {
  res.json({
    playerId: req.playerId,
    expiresAt: new Date(req.tokenPayload!.exp * 1000).toISOString(),
  });
});

export default router;
```

**4. Usage in Protected Routes**

```typescript
// routes/games.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const game = await gameService.createGame(req.playerId!);
    res.status(201).json(game);
  } catch (error) {
    next(error);
  }
});

router.get('/:gameId', async (req, res, next) => {
  try {
    const game = await gameService.getGame(req.params.gameId);

    // Verify ownership
    if (game.playerId !== req.playerId) {
      throw new ForbiddenError('You do not have access to this game');
    }

    res.json(game);
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Session Storage (Redis)

```typescript
// utils/redis.ts
import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function initRedis(): Redis {
  redisClient = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis connected');
  });

  return redisClient;
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis not initialized');
  }
  return redisClient;
}
```

---

## Caching Strategy & Implementation

### Cache Architecture

```
┌─────────────────────────────────────────────────┐
│  Application Layer                              │
│  ├── Check Cache (Redis)                        │
│  ├── Cache Miss → Database Query                │
│  ├── Populate Cache                             │
│  └── Return Data                                │
└─────────────────────────────────────────────────┘
```

### Implementation Patterns

**1. Card Database Cache (Static Data)**

```typescript
// services/CardService.ts
import { getRedisClient } from '../utils/redis';
import { CardRepository } from '../repositories/CardRepository';

export class CardService {
  private readonly CACHE_KEY_ALL_CARDS = 'cards:all';
  private readonly CACHE_KEY_CARD_PREFIX = 'card:';

  constructor(
    private cardRepo: CardRepository,
    private redis = getRedisClient()
  ) {}

  // Get all cards (cached indefinitely)
  async getAllCards(): Promise<Card[]> {
    try {
      // Try cache first
      const cached = await this.redis.get(this.CACHE_KEY_ALL_CARDS);

      if (cached) {
        return JSON.parse(cached);
      }

      // Cache miss - fetch from DB
      const cards = await this.cardRepo.findAll();

      // Populate cache (no expiration - static data)
      await this.redis.set(
        this.CACHE_KEY_ALL_CARDS,
        JSON.stringify(cards)
      );

      return cards;
    } catch (cacheError) {
      // Cache failure - fallback to DB
      console.warn('Cache error, falling back to DB:', cacheError);
      return await this.cardRepo.findAll();
    }
  }

  // Get single card (cached)
  async getCardById(cardId: string): Promise<Card | null> {
    const cacheKey = `${this.CACHE_KEY_CARD_PREFIX}${cardId}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const card = await this.cardRepo.findById(cardId);
      if (card) {
        await this.redis.set(cacheKey, JSON.stringify(card));
      }

      return card;
    } catch (cacheError) {
      console.warn('Cache error:', cacheError);
      return await this.cardRepo.findById(cardId);
    }
  }

  // Invalidate cache (admin only - card updates)
  async invalidateCardCache(): Promise<void> {
    await this.redis.del(this.CACHE_KEY_ALL_CARDS);
    // Also delete individual card keys if needed
    const keys = await this.redis.keys(`${this.CACHE_KEY_CARD_PREFIX}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Warm cache on server startup
  async warmCache(): Promise<void> {
    console.log('Warming card cache...');
    await this.getAllCards();
    console.log('Card cache warmed');
  }
}
```

**2. Game State Cache (Dynamic Data)**

```typescript
// services/GameService.ts
export class GameService {
  private readonly CACHE_KEY_GAME_PREFIX = 'game:';
  private readonly CACHE_TTL_GAME = 3600; // 1 hour

  constructor(
    private gameRepo: GameRepository,
    private redis = getRedisClient()
  ) {}

  // Get game (with caching)
  async getGame(gameId: string): Promise<Game> {
    const cacheKey = `${this.CACHE_KEY_GAME_PREFIX}${gameId}`;

    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        // Extend TTL on access (sliding window)
        await this.redis.expire(cacheKey, this.CACHE_TTL_GAME);
        return JSON.parse(cached);
      }
    } catch (cacheError) {
      console.warn('Cache read error:', cacheError);
    }

    // Cache miss - fetch from DB
    const game = await this.gameRepo.findById(gameId);
    if (!game) {
      throw new NotFoundError('Game not found', 'GAME_NOT_FOUND');
    }

    // Populate cache
    try {
      await this.redis.setex(
        cacheKey,
        this.CACHE_TTL_GAME,
        JSON.stringify(game)
      );
    } catch (cacheError) {
      console.warn('Cache write error:', cacheError);
    }

    return game;
  }

  // Update game (write-through cache)
  async updateGame(gameId: string, updates: Partial<Game>): Promise<Game> {
    // Update database first
    const updatedGame = await this.gameRepo.update(gameId, updates);

    // Update cache (write-through)
    const cacheKey = `${this.CACHE_KEY_GAME_PREFIX}${gameId}`;
    try {
      await this.redis.setex(
        cacheKey,
        this.CACHE_TTL_GAME,
        JSON.stringify(updatedGame)
      );
    } catch (cacheError) {
      console.warn('Cache update error:', cacheError);
      // Don't fail the operation if cache fails
    }

    return updatedGame;
  }

  // Invalidate cache on delete
  async deleteGame(gameId: string): Promise<void> {
    await this.gameRepo.delete(gameId);

    const cacheKey = `${this.CACHE_KEY_GAME_PREFIX}${gameId}`;
    try {
      await this.redis.del(cacheKey);
    } catch (cacheError) {
      console.warn('Cache invalidation error:', cacheError);
    }
  }
}
```

**3. Cache Helper Utilities**

```typescript
// utils/cache.ts
import { getRedisClient } from './redis';

export class CacheHelper {
  constructor(private redis = getRedisClient()) {}

  // Generic cache wrapper
  async cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Cache read error:', error);
    }

    const data = await fetcher();

    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Cache write error:', error);
    }

    return data;
  }

  // Batch get/set
  async getCached<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    if (keys.length === 0) return results;

    const values = await this.redis.mget(...keys);

    keys.forEach((key, index) => {
      if (values[index]) {
        results.set(key, JSON.parse(values[index]!));
      }
    });

    return results;
  }

  // Invalidate pattern
  async invalidatePattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return 0;
    return await this.redis.del(...keys);
  }
}
```

---

## Error Handling Standards

### Error Classes

```typescript
// errors/AppError.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// 4xx Client Errors
export class BadRequestError extends AppError {
  constructor(message: string, code: string = 'BAD_REQUEST', details?: any) {
    super(message, code, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, code: string = 'UNAUTHORIZED', details?: any) {
    super(message, code, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, code: string = 'FORBIDDEN', details?: any) {
    super(message, code, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, code: string = 'NOT_FOUND', details?: any) {
    super(message, code, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: string = 'CONFLICT', details?: any) {
    super(message, code, 409, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 422, details);
  }
}

// 5xx Server Errors
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 'INTERNAL_SERVER_ERROR', 500, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'SERVICE_UNAVAILABLE', 503, details);
  }
}
```

### Error Handler Middleware

```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Add request ID to all errors
  const requestId = req.headers['x-request-id'] || generateRequestId();

  if (error instanceof AppError) {
    // Known application error
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
        requestId,
      },
    });

    // Log based on severity
    if (error.statusCode >= 500) {
      logger.error('Server error', {
        error: error.message,
        code: error.code,
        stack: error.stack,
        requestId,
      });
    } else {
      logger.warn('Client error', {
        error: error.message,
        code: error.code,
        requestId,
      });
    }
  } else {
    // Unexpected error
    logger.error('Unexpected error', {
      error: error.message,
      stack: error.stack,
      requestId,
    });

    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
```

### Validation Errors (Zod Integration)

```typescript
// middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '../errors/AppError';

export function validate(schema: z.ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        next(
          new ValidationError('Request validation failed', { errors: details })
        );
      } else {
        next(error);
      }
    }
  };
}

// Usage example
import { z } from 'zod';

const createGameSchema = z.object({
  difficulty: z.enum(['easy', 'normal', 'hard']).optional().default('normal'),
});

router.post('/games', validate(createGameSchema), async (req, res, next) => {
  // req.body is now validated and typed
  const { difficulty } = req.body;
  // ...
});
```

---

## Database Access Patterns

### Repository Pattern

```typescript
// repositories/GameRepository.ts
import { Knex } from 'knex';
import { Game, GameStatus } from '../types';

export class GameRepository {
  constructor(private db: Knex) {}

  async create(gameData: Partial<Game>): Promise<Game> {
    const [game] = await this.db('games')
      .insert({
        game_id: gameData.gameId,
        player_id: gameData.playerId,
        status: gameData.status || 'active',
        current_turn: 0,
        phase: 'tavern',
        slot_upgrades: JSON.stringify({
          hp: false,
          shield: false,
          special: false,
          passive: false,
          normal: false,
        }),
        boss_defeated: false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return this.mapToGame(game);
  }

  async findById(gameId: string): Promise<Game | null> {
    const game = await this.db('games')
      .where({ game_id: gameId })
      .first();

    if (!game) return null;

    // Eager load related data
    const [equippedCards, reserveCards, tavernCards] = await Promise.all([
      this.loadEquippedCards(gameId),
      this.loadReserveCards(gameId),
      this.loadTavernCards(gameId),
    ]);

    return this.mapToGame(game, {
      equippedCards,
      reserveCards,
      tavernCards,
    });
  }

  async update(gameId: string, updates: Partial<Game>): Promise<Game> {
    const [updated] = await this.db('games')
      .where({ game_id: gameId })
      .update({
        ...this.mapToDb(updates),
        updated_at: new Date(),
      })
      .returning('*');

    if (!updated) {
      throw new NotFoundError('Game not found');
    }

    return this.findById(gameId)!;
  }

  async delete(gameId: string): Promise<void> {
    await this.db('games').where({ game_id: gameId }).delete();
  }

  async findActiveByPlayerId(playerId: string): Promise<Game[]> {
    const games = await this.db('games')
      .where({ player_id: playerId, status: 'active' })
      .orderBy('updated_at', 'desc');

    return Promise.all(
      games.map((game) => this.findById(game.game_id))
    ).then((results) => results.filter(Boolean) as Game[]);
  }

  // Helper methods
  private async loadEquippedCards(gameId: string): Promise<any> {
    const equipped = await this.db('equipped_cards')
      .where({ game_id: gameId })
      .join('cards', 'equipped_cards.card_id', 'cards.card_id');

    return this.groupBySlot(equipped);
  }

  private async loadReserveCards(gameId: string): Promise<Card[]> {
    return await this.db('player_cards')
      .where({ game_id: gameId, location: 'reserve' })
      .join('cards', 'player_cards.card_id', 'cards.card_id');
  }

  private async loadTavernCards(gameId: string): Promise<Card[]> {
    return await this.db('tavern_cards')
      .where({ game_id: gameId })
      .join('cards', 'tavern_cards.card_id', 'cards.card_id')
      .orderBy('position', 'asc');
  }

  private mapToGame(dbGame: any, relations?: any): Game {
    return {
      gameId: dbGame.game_id,
      playerId: dbGame.player_id,
      status: dbGame.status,
      currentTurn: dbGame.current_turn,
      phase: dbGame.phase,
      equippedSlots: relations?.equippedCards || {},
      slotUpgrades: JSON.parse(dbGame.slot_upgrades),
      reserveCards: relations?.reserveCards || [],
      tavernCards: relations?.tavernCards || [],
      activeCombat: dbGame.active_combat
        ? JSON.parse(dbGame.active_combat)
        : null,
      bossDefeated: dbGame.boss_defeated,
      createdAt: dbGame.created_at,
      updatedAt: dbGame.updated_at,
    };
  }

  private mapToDb(game: Partial<Game>): any {
    const dbData: any = {};

    if (game.status) dbData.status = game.status;
    if (game.currentTurn !== undefined) dbData.current_turn = game.currentTurn;
    if (game.phase) dbData.phase = game.phase;
    if (game.slotUpgrades) dbData.slot_upgrades = JSON.stringify(game.slotUpgrades);
    if (game.activeCombat !== undefined) {
      dbData.active_combat = game.activeCombat
        ? JSON.stringify(game.activeCombat)
        : null;
    }
    if (game.bossDefeated !== undefined) dbData.boss_defeated = game.bossDefeated;

    return dbData;
  }

  private groupBySlot(equipped: any[]): Record<string, Card[]> {
    const slots: Record<string, Card[]> = {
      hp: [],
      shield: [],
      special: [],
      passive: [],
      normal: [],
    };

    equipped.forEach((item) => {
      slots[item.slot].push(item);
    });

    return slots;
  }
}
```

### Transaction Pattern

```typescript
// services/CombatService.ts
export class CombatService {
  constructor(
    private db: Knex,
    private gameRepo: GameRepository,
    private cardRepo: CardRepository
  ) {}

  async resolveCombat(gameId: string, combatId: string): Promise<CombatState> {
    // Use transaction for atomic combat resolution
    return await this.db.transaction(async (trx) => {
      // Lock game row to prevent concurrent modifications
      const game = await trx('games')
        .where({ game_id: gameId })
        .forUpdate()
        .first();

      if (!game) {
        throw new NotFoundError('Game not found');
      }

      const combat = JSON.parse(game.active_combat);
      if (!combat || combat.combatId !== combatId) {
        throw new NotFoundError('Combat not found');
      }

      // Calculate damage
      const playerAttack = this.calculatePlayerAttack(combat);
      const enemyDamage = Math.max(0, playerAttack - combat.targetCurrentShield);

      // Update enemy HP
      combat.targetCurrentHp -= enemyDamage;

      // If enemy alive, retaliate
      if (combat.targetCurrentHp > 0) {
        const retaliation = this.calculateRetaliation(combat);
        combat.playerStats.currentHp -= retaliation;

        // Regenerate enemy shield
        combat.targetCurrentShield = combat.targetCard.shield;
      }

      // Check combat end
      if (combat.targetCurrentHp <= 0) {
        combat.status = 'victory';

        // Add card to reserve
        await trx('player_cards').insert({
          game_id: gameId,
          card_id: combat.targetCard.cardId,
          location: 'reserve',
        });

        // Replenish tavern
        const newCard = await this.selectRandomCard();
        await trx('tavern_cards')
          .where({ game_id: gameId, card_id: combat.targetCard.cardId })
          .update({ card_id: newCard.cardId });
      } else if (combat.playerStats.currentHp <= 0) {
        combat.status = 'defeat';
      }

      // Update game
      await trx('games')
        .where({ game_id: gameId })
        .update({
          active_combat: JSON.stringify(combat),
          updated_at: new Date(),
        });

      return combat;
    });
  }
}
```

### Optimistic Locking

```typescript
// repositories/GameRepository.ts (with versioning)
async updateWithVersion(
  gameId: string,
  updates: Partial<Game>,
  expectedVersion: number
): Promise<Game> {
  const result = await this.db('games')
    .where({ game_id: gameId, version: expectedVersion })
    .update({
      ...this.mapToDb(updates),
      version: expectedVersion + 1,
      updated_at: new Date(),
    })
    .returning('*');

  if (result.length === 0) {
    throw new ConflictError(
      'Game has been modified by another request',
      'CONCURRENT_MODIFICATION'
    );
  }

  return this.mapToGame(result[0]);
}
```

---

## Middleware & Request Pipeline

### Complete Middleware Stack

```typescript
// server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { requestId } from './middleware/requestId';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID (for correlation)
app.use(requestId);

// Logging
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Rate limiting
app.use('/api', rateLimiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/games', authenticate, gameRoutes);
app.use('/api/v1/cards', cardRoutes);
app.use('/api/v1/combat', authenticate, combatRoutes);
app.use('/health', healthRoutes);

// Error handler (must be last)
app.use(errorHandler);
```

### Rate Limiter

```typescript
// middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../utils/redis';

export const rateLimiter = rateLimit({
  store: new RedisStore({
    client: getRedisClient(),
    prefix: 'rate_limit:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});

// Combat-specific rate limiter
export const combatRateLimiter = rateLimit({
  store: new RedisStore({
    client: getRedisClient(),
    prefix: 'rate_limit:combat:',
  }),
  windowMs: 60 * 1000,
  max: 10, // 10 combat actions per minute
  message: {
    error: {
      code: 'COMBAT_RATE_LIMIT',
      message: 'Too many combat actions, please wait',
    },
  },
});
```

### Request ID

```typescript
// middleware/requestId.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = req.headers['x-request-id'] || `req_${uuidv4()}`;
  req.headers['x-request-id'] = id as string;
  res.setHeader('X-Request-Id', id);
  next();
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-15
**Status:** Complete Implementation Guide
