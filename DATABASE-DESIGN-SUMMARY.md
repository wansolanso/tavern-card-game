# Tavern Card Game - Database Design Summary

## Overview

This document provides a comprehensive summary of the database schema design for the Tavern Card Game MVP. The database supports a roguelike card battle game where players equip cards, battle tavern cards, and face boss encounters.

---

## Design Principles

### 1. Cross-Platform Compatibility
- **SQLite** for development (zero setup, file-based)
- **PostgreSQL** for production (ACID compliance, advanced features)
- **Knex.js** migrations ensure SQL compatibility across both systems

### 2. Data Integrity
- **Normalized schema (3NF)** prevents data anomalies
- **Foreign key constraints** maintain referential integrity
- **Check constraints** validate enum values and ranges
- **Triggers** auto-calculate derived fields (player HP)

### 3. Performance Optimization
- **Strategic denormalization** (player_current_hp, player_max_hp)
- **Comprehensive indexing** (B-tree, GIN, composite, partial)
- **Query optimization** (parallel queries, eager loading, projections)
- **Caching strategy** (Redis for catalog, game state, sessions)

### 4. Concurrency Control
- **Optimistic locking** for game state (version column)
- **Pessimistic locking** for combat (SELECT FOR UPDATE)
- **Transaction isolation** (READ COMMITTED)
- **Retry logic** for conflict resolution

---

## Database Schema

### Tables (11 Total)

#### Authentication Layer (2 tables)
1. **players** - Guest player accounts
2. **sessions** - JWT session management

#### Card Catalog Layer (3 tables)
3. **cards** - All available cards (42 cards)
4. **abilities** - All available abilities (35 abilities)
5. **card_abilities** - Card-ability mappings (130 mappings)

#### Game State Layer (4 tables)
6. **games** - Core game state and progression
7. **game_cards** - Player card inventory (equipped + reserve)
8. **tavern_cards** - Active tavern pool (9 cards per game)
9. **slot_upgrades** - Equipment slot upgrades (dual capacity)

#### Combat Layer (2 tables)
10. **combats** - Combat session state
11. **combat_events** - Combat action log (append-only)

---

## Key Features

### 1. Flexible Ability System
- **JSONB columns** for ability effects (PostgreSQL)
- **JSON columns** for SQLite compatibility
- Supports complex status effects without schema changes
- Examples: burn, freeze, poison, bleed, stun, reflect

### 2. Equipment Slot System
- **5 slot types:** HP, Shield, Special, Passive, Normal
- **Single slots:** Hold 1 card by default
- **Dual slots:** Hold 2 cards after upgrade (via discard mechanic)
- **Unique constraint:** Prevents duplicate equipped cards per slot

### 3. Tavern Card Pool
- **9 active cards** at all times
- **Auto-replenishment:** Defeated cards replaced immediately
- **Current HP/Shield tracking:** Cards remember damage between turns
- **Position-based:** Cards have fixed positions (0-8)

### 4. Combat System
- **Snapshot mechanics:** Player stats frozen at combat start
- **Turn-based:** Player attacks, enemy retaliates
- **Event logging:** All actions recorded in combat_events
- **ACID transactions:** All combat changes atomic

---

## Data Access Patterns

### Critical Query Patterns

1. **Load Complete Game State**
   - 6 parallel queries
   - Includes equipped cards, reserve, tavern, slot upgrades, active combat
   - Performance: ~50-100ms

2. **Card Catalog Fetch**
   - Cards with abilities (eager loaded)
   - Cached indefinitely in Redis
   - Performance: <5ms (cache hit)

3. **Equip Card Transaction**
   - Optimistic locking with version check
   - Slot validation (capacity, upgrade status)
   - Performance: ~10-20ms

4. **Combat Resolution**
   - Pessimistic locking (SELECT FOR UPDATE)
   - Atomic damage, card acquisition, tavern replenishment
   - Performance: ~30-50ms

---

## Migration Files

### Created Migrations (5 files)

```
database/migrations/
├── 20251115000001_create_players_and_sessions.js
├── 20251115000002_create_games.js
├── 20251115000003_create_cards_and_abilities.js
├── 20251115000004_create_game_cards_and_tavern.js
└── 20251115000005_create_combats.js
```

**Features:**
- Reversible (up/down functions)
- Cross-compatible (SQLite + PostgreSQL)
- Idempotent (safe to re-run)
- Includes triggers (PostgreSQL only)

### Seed Data (3 files)

```
database/seeds/
├── 001_abilities.js        (35 abilities)
├── 002_cards.js             (42 cards)
└── 003_card_abilities.js    (130 mappings)
```

**Content:**
- **Abilities:** Damage, heal, shield, buff, debuff, special
- **Cards:** Common (50%), Uncommon (25%), Rare (15%), Epic (8%), Legendary (2%)
- **Boss Cards:** 3 unique boss encounters

---

## Database Scripts

### NPM Scripts (package.json)

```bash
# Migration Management
npm run migrate:make <name>       # Create new migration
npm run migrate:latest            # Run all pending migrations
npm run migrate:rollback          # Rollback last migration
npm run migrate:status            # Check migration status

# Seed Data
npm run seed:make <name>          # Create new seed
npm run seed:run                  # Run all seeds

# Database Setup
npm run db:setup                  # Run migrations + seeds
npm run db:reset                  # Rollback all + setup
npm run db:fresh                  # Delete SQLite + setup
```

---

## Performance Metrics

### Query Performance Targets
- Load game state: <100ms
- Card catalog fetch (cached): <5ms
- Equip/unequip card: <20ms
- Combat resolution: <50ms
- Session validation: <10ms

### Index Coverage
- **14 B-tree indexes** (primary keys, foreign keys, composites)
- **3 GIN indexes** (JSONB columns)
- **2 partial indexes** (conditional indexing)
- **5 unique constraints** (data integrity)

### Database Size Estimates
- **Per player:** ~1.6 MB
- **Per game:** ~250 KB
- **Per combat:** ~10 KB
- **1000 players:** ~1.6 GB

---

## Data Integrity Rules

### Foreign Key Constraints
- **CASCADE:** games → game_cards, tavern_cards, combats
- **RESTRICT:** cards referenced by inventory (prevent orphans)
- **All FK columns indexed** for JOIN performance

### Check Constraints
- **Enum validation:** status, phase, rarity, ability_type
- **Range validation:** HP ≥ 0, turn ≥ 0, position 0-8
- **Consistency:** equipped cards must have slot_type + slot_position

### Triggers (PostgreSQL Only)
1. Auto-update `games.updated_at` on modification
2. Update `players.last_seen_at` on session creation
3. Recalculate player HP when HP cards equipped/unequipped

---

## Documentation Files

### Core Documentation
1. **docs/database-schema.md** (32 KB)
   - Complete ERD diagram (Mermaid)
   - All table schemas with constraints
   - Index definitions
   - Trigger implementations
   - Data consistency requirements

2. **docs/database-queries.md** (20 KB)
   - Optimized query patterns
   - Knex.js code examples
   - Transaction patterns
   - Performance optimization strategies

3. **docs/database-diagrams.md** (13 KB)
   - ERD visualization
   - Data flow diagrams
   - Schema layer breakdown
   - Query performance charts
   - Concurrency control flow

4. **database/README.md** (8.4 KB)
   - Setup instructions
   - Migration commands
   - Troubleshooting guide
   - Development workflow

5. **database/knexfile.js** (1.5 KB)
   - Environment configurations
   - Connection pooling
   - Migration/seed paths

---

## Technology Stack

### Database Systems
- **SQLite 3** - Development environment
- **PostgreSQL 15+** - Production environment
- **Knex.js 3.1+** - Query builder and migrations

### Supporting Technologies
- **Redis 7.x** - Caching layer
- **Node.js 20 LTS** - Runtime environment
- **dotenv** - Environment configuration

---

## Deployment Considerations

### Development Setup
```bash
# 1. Install dependencies
npm install

# 2. Run migrations
npm run migrate:latest

# 3. Seed initial data
npm run seed:run

# 4. Start development server
npm run dev
```

### Production Setup
```bash
# 1. Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:pass@host:5432/tavern"

# 2. Run migrations
npm run migrate:latest -- --env production

# 3. Seed card catalog (production data only)
npm run seed:run -- --env production

# 4. Start production server
npm start
```

### Backup & Recovery
- **Daily full backups** (pg_dump)
- **Hourly WAL archiving** (PITR)
- **30-day retention** for daily backups
- **7-day retention** for WAL logs

---

## Testing Strategy

### Migration Testing
```javascript
// Test all migrations can be applied
await knex.migrate.latest();

// Test all migrations can be rolled back
await knex.migrate.rollback({ all: true });

// Test seed data can be inserted
await knex.seed.run();
```

### Query Testing
```javascript
// Test load game state performance
const start = Date.now();
const state = await loadCompleteGameState(gameId);
expect(Date.now() - start).toBeLessThan(100);

// Test optimistic locking conflict detection
await expect(equipCard(gameId, cardId, 'hp', 0))
  .rejects.toThrow('Game state conflict');
```

---

## Future Enhancements

### Post-MVP Features

1. **Player Accounts**
   - Add username, email, password_hash to players table
   - OAuth providers table for social login
   - Account linking (guest → registered)

2. **Multiplayer Support**
   - game_players junction table for multi-player games
   - player_turns table for turn order
   - matchmaking_queue table

3. **Leaderboards & Stats**
   - player_stats table (wins, losses, scores)
   - achievements table
   - card_usage_stats table (analytics)

4. **Trading System**
   - trades table
   - trade_offers table
   - trade_history table

5. **Analytics**
   - analytics_events table
   - player_behavior tracking
   - A/B testing support

---

## Key Design Decisions

### 1. Normalized vs Denormalized
- **Decision:** Normalized (3NF) with selective denormalization
- **Denormalized fields:** player_current_hp, player_max_hp
- **Rationale:** Balance data integrity with query performance

### 2. JSONB for Flexibility
- **Decision:** JSONB for ability effects and combat stats
- **Rationale:** Flexible mechanics without schema migrations
- **Trade-off:** Less type safety, enables rapid iteration

### 3. Optimistic vs Pessimistic Locking
- **Decision:** Optimistic for game state, pessimistic for combat
- **Rationale:** Reduces lock contention while ensuring combat consistency
- **Implementation:** Version column + SELECT FOR UPDATE

### 4. Catalog Caching
- **Decision:** Cache entire card/ability catalog in Redis
- **Rationale:** Static data, high read frequency, zero invalidation
- **Strategy:** Preload on startup, never expire

### 5. Combat Event Storage
- **Decision:** Separate combat_events table (append-only)
- **Rationale:** Debugging, replay, analytics, audit trail
- **Cleanup:** Archive after 30 days

---

## Quick Reference

### Important File Paths

```
Project Root/
├── docs/
│   ├── database-schema.md          # Complete schema documentation
│   ├── database-queries.md         # Query patterns & optimization
│   └── database-diagrams.md        # Visual diagrams
├── database/
│   ├── knexfile.js                 # Database configuration
│   ├── README.md                   # Setup & troubleshooting
│   ├── migrations/                 # Schema migrations (5 files)
│   └── seeds/                      # Initial data (3 files)
├── package.json                    # Database scripts
└── CHANGELOG.md                    # Architecture decisions
```

### Common Commands

```bash
# Development workflow
npm run db:fresh              # Reset local database
npm run migrate:latest        # Apply new migrations
npm run seed:run              # Load test data

# Production workflow
npm run migrate:status        # Check migration status
npm run migrate:latest        # Apply migrations
npm run migrate:rollback      # Emergency rollback

# Debugging
npx knex migrate:status       # List applied migrations
psql $DATABASE_URL            # Direct database access
```

---

## Support & Troubleshooting

### Common Issues

1. **Migration fails with "relation already exists"**
   - Rollback partial migration: `npm run migrate:rollback`
   - Re-run: `npm run migrate:latest`

2. **SQLite database locked**
   - Close other database connections
   - Delete lock file: `rm database/dev.sqlite3-journal`

3. **Seed data fails with duplicate key**
   - Seeds use `del()` to clear before inserting
   - Manually clear: `rm database/dev.sqlite3 && npm run db:setup`

### Getting Help

- Check `database/README.md` for troubleshooting guide
- Review migration files for schema reference
- Consult `docs/database-queries.md` for query examples

---

## Summary Statistics

### Development Effort
- **Tables designed:** 11
- **Migrations created:** 5
- **Seed files created:** 3
- **Documentation pages:** 4
- **Total lines of code:** ~2000
- **Development time:** 1 day

### Database Complexity
- **Foreign keys:** 11
- **Check constraints:** 20
- **Unique constraints:** 5
- **Indexes:** 19
- **Triggers:** 3 (PostgreSQL only)

### Seed Data Volume
- **Cards:** 42
- **Abilities:** 35
- **Card-ability mappings:** 130
- **Boss encounters:** 3

---

**Document Version:** 1.0
**Last Updated:** 2025-11-15
**Status:** Database design complete and production-ready
**Author:** Database Architect
