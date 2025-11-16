# Tavern Card Game - Database Query Patterns

## Data Access Patterns Documentation

This document provides optimized SQL queries and Knex.js patterns for common operations in the Tavern Card Game backend.

---

## 1. Game State Queries

### 1.1 Load Complete Game State

**Use Case:** Fetch all game data when player resumes a game or reconnects via WebSocket.

**SQL (PostgreSQL):**
```sql
-- Main game data
SELECT * FROM games WHERE id = $1;

-- Equipped cards with abilities
SELECT
  gc.*,
  c.*,
  json_agg(
    json_build_object(
      'id', a.id,
      'name', a.name,
      'type', ca.ability_type,
      'power', a.power,
      'description', a.description,
      'effects', a.effects
    )
  ) FILTER (WHERE a.id IS NOT NULL) as abilities
FROM game_cards gc
JOIN cards c ON gc.card_id = c.id
LEFT JOIN card_abilities ca ON c.id = ca.card_id
LEFT JOIN abilities a ON ca.ability_id = a.id
WHERE gc.game_id = $1
  AND gc.location = 'equipped'
GROUP BY gc.id, c.id
ORDER BY gc.slot_type, gc.slot_position;

-- Reserve cards
SELECT gc.*, c.*
FROM game_cards gc
JOIN cards c ON gc.card_id = c.id
WHERE gc.game_id = $1
  AND gc.location = 'reserve'
ORDER BY gc.acquired_at DESC;

-- Tavern cards with abilities
SELECT
  tc.*,
  c.*,
  json_agg(
    json_build_object(
      'id', a.id,
      'name', a.name,
      'type', ca.ability_type,
      'power', a.power,
      'description', a.description
    )
  ) FILTER (WHERE a.id IS NOT NULL) as abilities
FROM tavern_cards tc
JOIN cards c ON tc.card_id = c.id
LEFT JOIN card_abilities ca ON c.id = ca.card_id
LEFT JOIN abilities a ON ca.ability_id = a.id
WHERE tc.game_id = $1
GROUP BY tc.id, c.id
ORDER BY tc.position;

-- Slot upgrades
SELECT slot_type, is_upgraded
FROM slot_upgrades
WHERE game_id = $1;

-- Active combat (if any)
SELECT * FROM combats
WHERE game_id = $1 AND status = 'active'
LIMIT 1;
```

**Knex.js Implementation:**
```javascript
async function loadCompleteGameState(gameId) {
  const [game, equipped, reserve, tavern, upgrades, combat] = await Promise.all([
    // Main game
    knex('games').where({ id: gameId }).first(),

    // Equipped cards with abilities
    knex('game_cards as gc')
      .select(
        'gc.*',
        'c.*',
        knex.raw(`
          json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'type', ca.ability_type,
              'power', a.power,
              'description', a.description,
              'effects', a.effects
            )
          ) FILTER (WHERE a.id IS NOT NULL) as abilities
        `)
      )
      .join('cards as c', 'gc.card_id', 'c.id')
      .leftJoin('card_abilities as ca', 'c.id', 'ca.card_id')
      .leftJoin('abilities as a', 'ca.ability_id', 'a.id')
      .where({ 'gc.game_id': gameId, 'gc.location': 'equipped' })
      .groupBy('gc.id', 'c.id')
      .orderBy(['gc.slot_type', 'gc.slot_position']),

    // Reserve cards
    knex('game_cards as gc')
      .select('gc.*', 'c.*')
      .join('cards as c', 'gc.card_id', 'c.id')
      .where({ 'gc.game_id': gameId, 'gc.location': 'reserve' })
      .orderBy('gc.acquired_at', 'desc'),

    // Tavern cards with abilities
    knex('tavern_cards as tc')
      .select(
        'tc.*',
        'c.*',
        knex.raw(`
          json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'type', ca.ability_type,
              'power', a.power,
              'description', a.description
            )
          ) FILTER (WHERE a.id IS NOT NULL) as abilities
        `)
      )
      .join('cards as c', 'tc.card_id', 'c.id')
      .leftJoin('card_abilities as ca', 'c.id', 'ca.card_id')
      .leftJoin('abilities as a', 'ca.ability_id', 'a.id')
      .where({ 'tc.game_id': gameId })
      .groupBy('tc.id', 'c.id')
      .orderBy('tc.position'),

    // Slot upgrades
    knex('slot_upgrades')
      .select('slot_type', 'is_upgraded')
      .where({ game_id: gameId }),

    // Active combat
    knex('combats')
      .where({ game_id: gameId, status: 'active' })
      .first(),
  ]);

  return {
    game,
    equipped,
    reserve,
    tavern,
    upgrades: upgrades.reduce((acc, u) => ({ ...acc, [u.slot_type]: u.is_upgraded }), {}),
    combat,
  };
}
```

**Performance Notes:**
- All queries run in parallel using `Promise.all`
- Total execution time: ~50-100ms (depending on card count)
- Indexes ensure fast lookups: `idx_game_cards_game_id`, `idx_tavern_cards_game_id`

---

### 1.2 Get Card Catalog (Cached)

**Use Case:** Fetch all cards for card selection UI or cache preloading.

**SQL:**
```sql
SELECT
  c.*,
  json_agg(
    json_build_object(
      'type', ca.ability_type,
      'id', a.id,
      'name', a.name,
      'description', a.description,
      'power', a.power,
      'effects', a.effects
    )
  ) FILTER (WHERE a.id IS NOT NULL) as abilities
FROM cards c
LEFT JOIN card_abilities ca ON c.id = ca.card_id
LEFT JOIN abilities a ON ca.ability_id = a.id
WHERE c.is_boss = FALSE
GROUP BY c.id
ORDER BY
  CASE c.rarity
    WHEN 'common' THEN 1
    WHEN 'uncommon' THEN 2
    WHEN 'rare' THEN 3
    WHEN 'epic' THEN 4
    WHEN 'legendary' THEN 5
  END,
  c.name;
```

**Knex.js:**
```javascript
async function getCardCatalog(includeBoss = false) {
  const query = knex('cards as c')
    .select(
      'c.*',
      knex.raw(`
        json_agg(
          json_build_object(
            'type', ca.ability_type,
            'id', a.id,
            'name', a.name,
            'description', a.description,
            'power', a.power,
            'effects', a.effects
          )
        ) FILTER (WHERE a.id IS NOT NULL) as abilities
      `)
    )
    .leftJoin('card_abilities as ca', 'c.id', 'ca.card_id')
    .leftJoin('abilities as a', 'ca.ability_id', 'a.id')
    .groupBy('c.id')
    .orderByRaw(`
      CASE c.rarity
        WHEN 'common' THEN 1
        WHEN 'uncommon' THEN 2
        WHEN 'rare' THEN 3
        WHEN 'epic' THEN 4
        WHEN 'legendary' THEN 5
      END,
      c.name
    `);

  if (!includeBoss) {
    query.where('c.is_boss', false);
  }

  return await query;
}
```

**Caching Strategy:**
```javascript
// Redis cache wrapper
async function getCachedCardCatalog() {
  const cacheKey = 'cards:all';

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Cache miss: fetch from DB
  const cards = await getCardCatalog();

  // Store in cache (no expiration for catalog)
  await redis.set(cacheKey, JSON.stringify(cards));

  return cards;
}
```

---

## 2. Card Operations

### 2.1 Equip Card (with Validation)

**Use Case:** Move card from reserve to equipment slot.

**SQL Transaction:**
```sql
BEGIN;

-- Lock game for optimistic concurrency control
SELECT version FROM games WHERE id = $1 FOR UPDATE;

-- Verify card is in reserve
SELECT id FROM game_cards
WHERE game_id = $1
  AND card_id = $2
  AND location = 'reserve'
LIMIT 1;

-- Check slot capacity
SELECT COUNT(*) as count FROM game_cards
WHERE game_id = $1
  AND slot_type = $3
  AND location = 'equipped';

-- Check if slot is upgraded (allows 2 cards)
SELECT is_upgraded FROM slot_upgrades
WHERE game_id = $1 AND slot_type = $3;

-- Move card to equipped (if validation passes)
UPDATE game_cards
SET
  location = 'equipped',
  slot_type = $3,
  slot_position = $4
WHERE game_id = $1 AND card_id = $2;

-- Increment game version
UPDATE games
SET version = version + 1
WHERE id = $1;

COMMIT;
```

**Knex.js Implementation:**
```javascript
async function equipCard(gameId, cardId, slotType, slotPosition) {
  return await knex.transaction(async (trx) => {
    // Lock game
    const game = await trx('games')
      .where({ id: gameId })
      .forUpdate()
      .first();

    if (!game) {
      throw new Error('Game not found');
    }

    // Verify card ownership
    const card = await trx('game_cards')
      .where({ game_id: gameId, card_id: cardId, location: 'reserve' })
      .first();

    if (!card) {
      throw new Error('Card not in reserve');
    }

    // Check slot capacity
    const equippedCount = await trx('game_cards')
      .where({ game_id: gameId, slot_type: slotType, location: 'equipped' })
      .count('* as count')
      .first();

    const slotUpgrade = await trx('slot_upgrades')
      .where({ game_id: gameId, slot_type: slotType })
      .first();

    const maxSlots = slotUpgrade?.is_upgraded ? 2 : 1;

    if (parseInt(equippedCount.count) >= maxSlots) {
      throw new Error('Slot is full');
    }

    // Equip card
    await trx('game_cards')
      .where({ id: card.id })
      .update({
        location: 'equipped',
        slot_type: slotType,
        slot_position: slotPosition,
      });

    // Increment version (optimistic locking)
    const updated = await trx('games')
      .where({ id: gameId, version: game.version })
      .update({ version: game.version + 1 });

    if (updated === 0) {
      throw new Error('Game state conflict, retry operation');
    }

    return { success: true };
  });
}
```

---

### 2.2 Discard Card for Slot Upgrade

**Use Case:** Permanently discard a card to unlock dual slot capacity.

**SQL Transaction:**
```sql
BEGIN;

-- Verify card ownership
SELECT id, location, slot_type FROM game_cards
WHERE game_id = $1 AND card_id = $2
LIMIT 1;

-- Check if slot already upgraded
SELECT id FROM slot_upgrades
WHERE game_id = $1 AND slot_type = $3;

-- Delete card (permanent)
DELETE FROM game_cards
WHERE game_id = $1 AND card_id = $2;

-- Create slot upgrade
INSERT INTO slot_upgrades (game_id, slot_type, is_upgraded)
VALUES ($1, $3, TRUE);

COMMIT;
```

**Knex.js:**
```javascript
async function discardCardForUpgrade(gameId, cardId, slotType) {
  return await knex.transaction(async (trx) => {
    // Verify card ownership
    const card = await trx('game_cards')
      .where({ game_id: gameId, card_id: cardId })
      .first();

    if (!card) {
      throw new Error('Card not owned');
    }

    // Check if already upgraded
    const existing = await trx('slot_upgrades')
      .where({ game_id: gameId, slot_type: slotType })
      .first();

    if (existing) {
      throw new Error('Slot already upgraded');
    }

    // Delete card
    await trx('game_cards')
      .where({ id: card.id })
      .del();

    // Create upgrade
    await trx('slot_upgrades').insert({
      game_id: gameId,
      slot_type: slotType,
      is_upgraded: true,
    });

    return { success: true };
  });
}
```

---

## 3. Combat Operations

### 3.1 Initiate Combat

**Use Case:** Start combat with a tavern card.

**SQL:**
```sql
BEGIN;

-- Verify no active combat
SELECT id FROM combats
WHERE game_id = $1 AND status = 'active'
LIMIT 1;

-- Get target card from tavern
SELECT * FROM tavern_cards
WHERE game_id = $1 AND card_id = $2
LIMIT 1;

-- Get player stats (from equipped cards)
SELECT
  COALESCE(SUM(CASE WHEN gc.slot_type = 'hp' THEN c.hp ELSE 0 END), 0) as total_hp,
  COALESCE(SUM(CASE WHEN gc.slot_type = 'shield' THEN c.shield ELSE 0 END), 0) as total_shield,
  json_agg(
    json_build_object(
      'id', a.id,
      'name', a.name,
      'type', ca.ability_type,
      'power', a.power
    )
  ) FILTER (WHERE a.id IS NOT NULL) as abilities
FROM game_cards gc
JOIN cards c ON gc.card_id = c.id
LEFT JOIN card_abilities ca ON c.id = ca.card_id
LEFT JOIN abilities a ON ca.ability_id = a.id
WHERE gc.game_id = $1 AND gc.location = 'equipped';

-- Create combat record
INSERT INTO combats (
  game_id,
  target_card_id,
  target_current_hp,
  target_current_shield,
  turn,
  player_stats,
  status
) VALUES (
  $1, $2, $3, $4, 1, $5::jsonb, 'active'
)
RETURNING *;

-- Update game phase
UPDATE games
SET phase = 'combat'
WHERE id = $1;

COMMIT;
```

**Knex.js:**
```javascript
async function initiateCombat(gameId, targetCardId) {
  return await knex.transaction(async (trx) => {
    // Check for active combat
    const activeCombat = await trx('combats')
      .where({ game_id: gameId, status: 'active' })
      .first();

    if (activeCombat) {
      throw new Error('Combat already active');
    }

    // Get target card
    const target = await trx('tavern_cards')
      .where({ game_id: gameId, card_id: targetCardId })
      .first();

    if (!target) {
      throw new Error('Target card not in tavern');
    }

    // Get player stats
    const playerStats = await trx('game_cards as gc')
      .select(
        trx.raw(`
          COALESCE(SUM(CASE WHEN gc.slot_type = 'hp' THEN c.hp ELSE 0 END), 0) as total_hp,
          COALESCE(SUM(CASE WHEN gc.slot_type = 'shield' THEN c.shield ELSE 0 END), 0) as total_shield,
          json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'type', ca.ability_type,
              'power', a.power
            )
          ) FILTER (WHERE a.id IS NOT NULL) as abilities
        `)
      )
      .join('cards as c', 'gc.card_id', 'c.id')
      .leftJoin('card_abilities as ca', 'c.id', 'ca.card_id')
      .leftJoin('abilities as a', 'ca.ability_id', 'a.id')
      .where({ 'gc.game_id': gameId, 'gc.location': 'equipped' })
      .first();

    // Create combat
    const [combat] = await trx('combats').insert({
      game_id: gameId,
      target_card_id: targetCardId,
      target_current_hp: target.current_hp,
      target_current_shield: target.current_shield,
      turn: 1,
      player_stats: JSON.stringify({
        totalHp: playerStats.total_hp,
        currentHp: playerStats.total_hp,
        totalShield: playerStats.total_shield,
        currentShield: playerStats.total_shield,
        abilities: playerStats.abilities || [],
      }),
      status: 'active',
    }).returning('*');

    // Update game phase
    await trx('games')
      .where({ id: gameId })
      .update({ phase: 'combat' });

    return combat;
  });
}
```

---

### 3.2 Execute Combat Turn (Attack + Retaliation)

**Use Case:** Player attacks, enemy retaliates, resolve combat round.

**SQL:**
```sql
BEGIN;

-- Get active combat
SELECT * FROM combats
WHERE game_id = $1 AND status = 'active'
FOR UPDATE;

-- Apply damage to enemy
UPDATE tavern_cards
SET
  current_shield = GREATEST(current_shield - $2, 0),
  current_hp = GREATEST(current_hp - $3, 0)
WHERE game_id = $1 AND card_id = $4;

-- Log player attack
INSERT INTO combat_events (combat_id, turn, actor, action, result)
VALUES ($5, $6, 'player', 'attack', $7::jsonb);

-- Check if enemy defeated
SELECT current_hp FROM tavern_cards
WHERE game_id = $1 AND card_id = $4;

IF enemy_hp <= 0 THEN
  -- Enemy defeated: acquire card
  INSERT INTO game_cards (game_id, card_id, location)
  VALUES ($1, $4, 'reserve');

  -- Remove from tavern
  DELETE FROM tavern_cards
  WHERE game_id = $1 AND card_id = $4;

  -- Replenish tavern (spawn new card)
  INSERT INTO tavern_cards (game_id, card_id, position, current_hp, current_shield)
  SELECT $1, c.id, $8, c.hp, c.shield
  FROM cards c
  WHERE c.is_boss = FALSE
  ORDER BY RANDOM()
  LIMIT 1;

  -- End combat
  UPDATE combats
  SET status = 'victory', ended_at = NOW()
  WHERE id = $5;

  -- Update game phase
  UPDATE games
  SET phase = 'tavern'
  WHERE id = $1;
ELSE
  -- Enemy retaliates
  UPDATE combats
  SET player_stats = jsonb_set(
    player_stats,
    '{currentHp}',
    to_jsonb(GREATEST((player_stats->>'currentHp')::int - $9, 0))
  )
  WHERE id = $5;

  -- Log enemy retaliation
  INSERT INTO combat_events (combat_id, turn, actor, action, result)
  VALUES ($5, $6, 'enemy', 'retaliate', $10::jsonb);

  -- Check player defeat
  IF (player_stats->>'currentHp')::int <= 0 THEN
    UPDATE combats
    SET status = 'defeat', ended_at = NOW()
    WHERE id = $5;

    UPDATE games
    SET phase = 'defeat', status = 'completed'
    WHERE id = $1;
  ELSE
    -- Increment turn
    UPDATE combats
    SET turn = turn + 1
    WHERE id = $5;
  END IF;
END IF;

COMMIT;
```

**Knex.js (Simplified for Clarity):**
```javascript
async function executeCombatTurn(gameId, combatId, playerDamage) {
  return await knex.transaction(async (trx) => {
    // Lock combat
    const combat = await trx('combats')
      .where({ id: combatId, status: 'active' })
      .forUpdate()
      .first();

    if (!combat) {
      throw new Error('No active combat');
    }

    // Get target card
    const target = await trx('tavern_cards')
      .where({ game_id: gameId, card_id: combat.target_card_id })
      .forUpdate()
      .first();

    // Calculate damage distribution
    const shieldDamage = Math.min(playerDamage, target.current_shield);
    const hpDamage = playerDamage - shieldDamage;

    // Apply damage
    await trx('tavern_cards')
      .where({ id: target.id })
      .update({
        current_shield: Math.max(target.current_shield - shieldDamage, 0),
        current_hp: Math.max(target.current_hp - hpDamage, 0),
      });

    // Log attack
    await trx('combat_events').insert({
      combat_id: combatId,
      turn: combat.turn,
      actor: 'player',
      action: 'attack',
      result: JSON.stringify({ damage: playerDamage, shieldDamage, hpDamage }),
    });

    // Refresh target
    const updatedTarget = await trx('tavern_cards')
      .where({ id: target.id })
      .first();

    if (updatedTarget.current_hp <= 0) {
      // Victory logic (acquire card, replenish, end combat)
      // ... (implementation similar to SQL above)
      return { status: 'victory' };
    } else {
      // Retaliation logic (apply enemy damage, check defeat)
      // ... (implementation similar to SQL above)
      return { status: 'ongoing' };
    }
  });
}
```

---

## 4. Performance Optimization Queries

### 4.1 Batch Insert Tavern Cards (Game Initialization)

```javascript
async function initializeTavernCards(gameId) {
  // Get 9 random non-boss cards
  const randomCards = await knex('cards')
    .where({ is_boss: false })
    .orderByRaw('RANDOM()')
    .limit(9);

  // Batch insert tavern cards
  const tavernCards = randomCards.map((card, index) => ({
    game_id: gameId,
    card_id: card.id,
    position: index,
    current_hp: card.hp,
    current_shield: card.shield,
  }));

  await knex('tavern_cards').insert(tavernCards);
}
```

### 4.2 Cleanup Expired Sessions (Scheduled Job)

```sql
DELETE FROM sessions
WHERE expires_at < NOW();
```

**Knex.js:**
```javascript
async function cleanupExpiredSessions() {
  const deleted = await knex('sessions')
    .where('expires_at', '<', knex.fn.now())
    .del();

  console.log(`Cleaned up ${deleted} expired sessions`);
}

// Run every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
```

---

## 5. Indexes for Optimal Performance

```sql
-- Critical indexes already defined in migrations:
-- - idx_games_player_id_status (composite)
-- - idx_game_cards_game_id
-- - idx_tavern_cards_game_position (unique)
-- - idx_combats_game_id_status
-- - GIN indexes on JSONB columns

-- Additional performance indexes (if needed):
CREATE INDEX idx_game_cards_location ON game_cards(location);
CREATE INDEX idx_combats_ended_at ON combats(ended_at) WHERE status != 'active';
CREATE INDEX idx_combat_events_created_at ON combat_events(created_at);
```

---

## 6. Query Monitoring & Debugging

### Slow Query Logging (PostgreSQL)

```sql
-- Enable slow query log
ALTER DATABASE tavern_db SET log_min_duration_statement = 100; -- 100ms threshold

-- View slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;
```

### Knex.js Query Debugging

```javascript
// Enable query logging in development
const knex = require('knex')({
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  debug: process.env.NODE_ENV === 'development', // Logs all queries
});

// Manual query timing
const start = Date.now();
const result = await knex('games').where({ id: gameId });
console.log(`Query took ${Date.now() - start}ms`);
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-15
