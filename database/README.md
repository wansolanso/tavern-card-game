# Tavern Card Game - Database Setup Guide

## Overview

This directory contains all database-related files for the Tavern Card Game:
- **Migrations:** Schema definitions and versioning
- **Seeds:** Initial data (cards, abilities)
- **Knexfile:** Database configuration

## Quick Start

### 1. Install Dependencies

```bash
npm install knex pg sqlite3 dotenv
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
# Development (SQLite)
NODE_ENV=development

# Production (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/tavern_db
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_SSL=false
```

### 3. Run Migrations

```bash
# Development (SQLite)
npx knex migrate:latest --env development

# Production (PostgreSQL)
npx knex migrate:latest --env production
```

### 4. Seed Initial Data

```bash
# Development
npx knex seed:run --env development

# Production (catalog only, no test data)
npx knex seed:run --env production
```

---

## Database Environments

### Development (SQLite)

- **Database:** `./database/dev.sqlite3`
- **Use Case:** Local development, testing
- **Pros:** Zero setup, file-based, portable
- **Cons:** Limited concurrency, no advanced features

### Test (In-Memory SQLite)

- **Database:** `:memory:`
- **Use Case:** Unit tests, CI/CD
- **Pros:** Fast, isolated, no cleanup needed
- **Cons:** Data lost after process exit

### Production (PostgreSQL)

- **Database:** Railway/Heroku PostgreSQL
- **Use Case:** Production deployment
- **Pros:** ACID compliance, advanced features, scalability
- **Connection:** Via `DATABASE_URL` environment variable

---

## Migration Commands

### Create New Migration

```bash
npx knex migrate:make migration_name
```

**Example:**
```bash
npx knex migrate:make add_player_stats_table
```

This creates a new file: `migrations/YYYYMMDDHHMMSS_add_player_stats_table.js`

### Run Migrations (Up)

```bash
# Latest version
npx knex migrate:latest

# Specific environment
npx knex migrate:latest --env production
```

### Rollback Migrations (Down)

```bash
# Rollback last batch
npx knex migrate:rollback

# Rollback all
npx knex migrate:rollback --all

# Rollback to specific version
npx knex migrate:down --to 20251115000003
```

### Check Migration Status

```bash
npx knex migrate:status
```

**Output:**
```
Found 5 Completed migrations
20251115000001_create_players_and_sessions.js
20251115000002_create_games.js
20251115000003_create_cards_and_abilities.js
20251115000004_create_game_cards_and_tavern.js
20251115000005_create_combats.js
```

---

## Seed Commands

### Run All Seeds

```bash
npx knex seed:run
```

### Run Specific Seed

```bash
npx knex seed:run --specific=001_abilities.js
```

### Create New Seed

```bash
npx knex seed:make seed_name
```

**Seed Execution Order:**
1. `001_abilities.js` - Ability catalog
2. `002_cards.js` - Card catalog
3. `003_card_abilities.js` - Card-ability mappings

---

## Database Schema Versioning

### Migration Best Practices

1. **Atomic Migrations:** Each migration should be a single, complete change
2. **Reversible:** Always implement `down()` method for rollbacks
3. **Idempotent:** Safe to run multiple times (use `IF NOT EXISTS`)
4. **Sequential:** Migrations run in timestamp order

**Example Migration:**
```javascript
exports.up = async function (knex) {
  await knex.schema.createTable('example', (table) => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('example');
};
```

### Migration Lifecycle

```
Development:
  1. Create migration: npx knex migrate:make feature
  2. Write up/down functions
  3. Test migration: npx knex migrate:latest
  4. Test rollback: npx knex migrate:rollback
  5. Commit to Git

Production:
  1. Pull latest code
  2. Run migrations: npx knex migrate:latest --env production
  3. Verify: npx knex migrate:status --env production
```

---

## Database Maintenance

### Backup Database (PostgreSQL)

```bash
# Full backup
pg_dump -Fc $DATABASE_URL > backup_$(date +%Y%m%d).dump

# Schema only
pg_dump -s $DATABASE_URL > schema.sql

# Data only
pg_dump -a $DATABASE_URL > data.sql
```

### Restore Database

```bash
# From custom format
pg_restore -d $DATABASE_URL backup_20251115.dump

# From SQL dump
psql $DATABASE_URL < backup.sql
```

### Reset Development Database

```bash
# SQLite: Delete file
rm database/dev.sqlite3

# Re-run migrations and seeds
npx knex migrate:latest
npx knex seed:run
```

### Reset Production Database (DANGEROUS)

```bash
# ⚠️ WARNING: This deletes all data!
npx knex migrate:rollback --all --env production
npx knex migrate:latest --env production
npx knex seed:run --env production
```

---

## Troubleshooting

### Migration Fails with "relation already exists"

**Cause:** Migration was partially applied

**Solution:**
```bash
# Check status
npx knex migrate:status

# Rollback failed migration
npx knex migrate:rollback

# Re-run
npx knex migrate:latest
```

### SQLite "SQLITE_BUSY: database is locked"

**Cause:** Multiple connections trying to write simultaneously

**Solutions:**
1. Close other database connections (SQLite GUI tools)
2. Use PostgreSQL for concurrent operations
3. Add retry logic in application code

### PostgreSQL Connection Refused

**Cause:** Database not running or wrong credentials

**Solutions:**
1. Verify `DATABASE_URL` is correct
2. Check database is running: `pg_isready -h <host> -p 5432`
3. Test connection: `psql $DATABASE_URL`

### Seeds Fail with "duplicate key value"

**Cause:** Seed data already exists

**Solution:**
```bash
# Seeds use `del()` to clear before inserting
# If fails, manually clear tables:
npx knex seed:run --specific=clear_all.js
```

**Create `clear_all.js` seed:**
```javascript
exports.seed = async function (knex) {
  await knex('card_abilities').del();
  await knex('abilities').del();
  await knex('cards').del();
};
```

---

## Performance Optimization

### Analyze Query Performance (PostgreSQL)

```sql
EXPLAIN ANALYZE
SELECT * FROM games WHERE player_id = 'xxx';
```

### Rebuild Indexes

```bash
# PostgreSQL
psql $DATABASE_URL -c "REINDEX DATABASE tavern_db;"
```

### Vacuum Database (PostgreSQL)

```bash
psql $DATABASE_URL -c "VACUUM ANALYZE;"
```

### Check Table Sizes

```sql
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Development Workflow

### Typical Workflow

1. **Feature Development:**
   ```bash
   # Create migration for new feature
   npx knex migrate:make add_player_achievements

   # Edit migration file
   # Test locally
   npx knex migrate:latest
   npx knex migrate:rollback
   npx knex migrate:latest

   # Commit migration
   git add database/migrations/*.js
   git commit -m "feat: add player achievements table"
   ```

2. **Deployment:**
   ```bash
   # On production server (Railway auto-runs migrations)
   # Or manually:
   npx knex migrate:latest --env production
   ```

3. **Rollback (if needed):**
   ```bash
   npx knex migrate:rollback --env production
   ```

---

## Testing Migrations

### Test Migration Script

```javascript
// test/migrations.test.js
const knex = require('knex')(require('../knexfile').test);

describe('Database Migrations', () => {
  beforeAll(async () => {
    await knex.migrate.latest();
  });

  afterAll(async () => {
    await knex.destroy();
  });

  test('should create all tables', async () => {
    const tables = [
      'players',
      'sessions',
      'games',
      'cards',
      'abilities',
      'card_abilities',
      'game_cards',
      'tavern_cards',
      'slot_upgrades',
      'combats',
      'combat_events',
    ];

    for (const table of tables) {
      const exists = await knex.schema.hasTable(table);
      expect(exists).toBe(true);
    }
  });

  test('should rollback all migrations', async () => {
    await knex.migrate.rollback({ all: true });

    const exists = await knex.schema.hasTable('games');
    expect(exists).toBe(false);
  });
});
```

---

## Additional Resources

- **Knex.js Documentation:** https://knexjs.org
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Database Schema:** See `docs/database-schema.md`
- **Query Patterns:** See `docs/database-queries.md`

---

**Version:** 1.0
**Last Updated:** 2025-11-15
