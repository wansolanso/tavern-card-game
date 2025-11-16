# Documentation Validation Report

**Date**: 2025-11-16
**Status**: Critical errors found in 3 core documents
**Overall Accuracy**: 59% (architecture), 85% (database), 33% (websocket)

---

## CRITICAL ISSUES REQUIRING IMMEDIATE FIX

### 1. websocket-events.md - COMPLETE REWRITE NEEDED (33% accuracy)

**Problem**: Event names in documentation use **colon-separated** format (`game:join`) but code uses **underscore-separated** (`join_game`). This causes complete mismatch.

**Impact**: Developers cannot use this document to implement features correctly.

**Action Required**: Complete rewrite of websocket-events.md to match actual implementation.

**Examples of mismatches**:
- Doc: `auth:authenticate` → Code: `authenticate`
- Doc: `game:joined` → Code: `game_joined`
- Doc: `game:state:updated` → Code: `game_updated`
- Doc: `combat:initiated` → Code: NOT IMPLEMENTED
- Doc: `card:equipped` → Code: NOT IMPLEMENTED (uses `game_updated` instead)

**Missing from docs**:
- `equip_card` (server listener)
- `unequip_card` (server listener)
- `discard_card` (server listener)
- `upgrade_slot` (server listener)
- `combat_result` (server emits)
- `attack` (server listener)

---

### 2. architecture.md - Service Methods Incorrect (60% accuracy)

**Problem**: Documented service methods don't match actual implementation.

**Critical corrections needed**:

#### GameService (lines 62-68)
**WRONG**:
```
- saveGame(gameId, state)
- endGame(gameId, outcome)
```

**CORRECT**:
```
- createGame(playerId)
- getGame(gameId)
- getPlayerGames(playerId)
- equipCard(gameId, cardId, slot)
- unequipCard(gameId, cardId)
- discardCard(gameId, cardId)
- updateGamePhase(gameId, phase)
- advanceTurn(gameId)
- updatePlayerHP(gameId, hp)
- replenishTavern(gameId)
```

#### CardService (lines 79-86)
**WRONG**:
```
- equipCard() - in CardService
- unequipCard() - in CardService
```

**CORRECT**: These methods are in **GameService**, NOT CardService.

**CardService actual methods**:
```
- getAllCards()
- getCardById(id)
- getCardsByRarity(rarity)
- getRegularCards()
- getBossCards()
- getRandomCards(count, excludeIds)
- warmCache()
- clearCache()
```

#### CombatService (lines 97-102)
**WRONG**:
```
- initiateCombat(gameId, targetCardId)
- executeTurn(gameId, combatId)
- endCombat(gameId, combatId, outcome)
```

**CORRECT**:
```
- attackTavernCard(gameId, targetCardId) - Single method handles full combat
- calculatePlayerAttack(game)
- calculatePlayerShield(game)
- calculateDamage(attackPower, targetShield)
- performRetaliation(game, attackerCard, combatLog)
- applyAbility(ability, game, combatLog, sourceName, sourceCard)
```

#### AuthService (lines 110-113)
**WRONG**:
```
- createGuestPlayer()
- validateSession(token)
- refreshSession(token)
```

**CORRECT**:
```
- createGuestSession() - Different name
- validateToken(token) - Different name
- revokeSession(token) - NOT documented
- cleanExpiredSessions() - NOT documented
- refreshSession() - DOES NOT EXIST
```

---

### 3. architecture.md - Cache TTL Values Wrong

**Location**: Lines 235-239

**WRONG**:
```
Game State Cache:
- Key: game:{gameId}
- TTL: 1 hour
```

**CORRECT**:
```
Game State Cache:
- Key: game:{gameId}
- TTL: 5 minutes (300 seconds)
```

**Source**: `src/constants/game.js` line 60

---

**Location**: Lines 228-233

**WRONG**:
```
Card Catalog Cache:
- TTL: No expiration
```

**CORRECT**:
```
Card Catalog Cache:
- TTL: 1 hour (3600 seconds)
```

**Source**: `src/constants/game.js` line 61

---

### 4. architecture.md - Technology Versions Wrong

**Location**: Line 619

**WRONG**: Express 4.x
**CORRECT**: Express 5.1.0

**Location**: Line 628

**WRONG**: Redis 7.x (ambiguous)
**CORRECT**:
- Redis Server: 7.x (if referring to Redis server)
- redis npm package: 5.9.0 (client library)

---

### 5. architecture.md - Features Documented But NOT Implemented

#### Health Endpoints (lines 497-526)
**Doc says**: 3 endpoints (`/health/live`, `/health/ready`, `/health/status`)
**Reality**: Only 1 basic endpoint (`/api/v1/health`) without DB/Redis checks

#### Player Inventory Cache (lines 243-249)
**Doc says**: Separate inventory cache with 30min TTL
**Reality**: Does NOT exist. Inventory is part of game state cache.

#### Idempotency (lines 479-493)
**Doc says**: Idempotency-Key header with Redis caching
**Reality**: NOT implemented. No middleware for this.

---

### 6. database-schema.md - players Table Incomplete

**Location**: players table documentation

**MISSING FIELD**:
```markdown
| guest_id | VARCHAR(255) | NOT NULL, UNIQUE | Guest account identifier |
```

**MISSING INDEX**:
```markdown
- INDEX: idx_players_created_at on created_at
```

**Source**: `database/migrations/20251115000001_create_players_and_sessions.js` line 8

---

### 7. database-schema.md - slot_upgrades Table WRONG

**Location**: slot_upgrades table

**WRONG FIELD**:
```markdown
| is_upgraded | BOOLEAN | NOT NULL, DEFAULT TRUE | Upgrade status |
```

**CORRECT FIELD**:
```markdown
| capacity | INTEGER | NOT NULL, DEFAULT 1 | Slot capacity (1 or 2) |
```

**Impact**: Completely different data model. Migration uses numeric capacity, doc uses boolean.

**Source**: `database/migrations/20251115000004_create_game_cards_and_tavern.js` line 126

---

### 8. database-schema.md - Trigger Syntax Wrong

**Location**: Line 611 (recalculate_hp_on_card_change trigger)

**WRONG**:
```sql
WHEN (NEW.slot_type = 'hp' OR OLD.slot_type = 'hp')
```

**CORRECT**:
```sql
WHEN (
  (TG_OP = 'INSERT' AND NEW.slot_type = 'hp') OR
  (TG_OP = 'UPDATE' AND (NEW.slot_type = 'hp' OR OLD.slot_type = 'hp')) OR
  (TG_OP = 'DELETE' AND OLD.slot_type = 'hp')
)
```

**Source**: `database/migrations/20251115000004_create_game_cards_and_tavern.js` lines 176-180

---

## MEDIUM PRIORITY ISSUES

### Repository Methods Incomplete

**Location**: Lines 398-415 in architecture.md

**Problem**: Only basic CRUD documented, but repositories have 15+ additional critical methods.

**Missing methods**:
- GameRepository: loadGameState, bulkLoadAbilities, equipCard, unequipCard, addTavernCard, removeTavernCard, updateTavernCardStats, upgradeSlot, getSlotCapacity, logCombat, logCombatEvent
- CardRepository: bulkAttachAbilities, getCardsByRarity, getRegularCards, getBossCards
- PlayerRepository: findByGuestId, createSession, findSessionByToken, deleteSession, cleanExpiredSessions

---

## LOW PRIORITY ISSUES

### Minor Version Discrepancies
- Winston version in doc (3.11.0) vs package.json (3.18.3) - functionally equivalent

### Seed Data Count
- Doc says "50+ cards" (line 1020 database-schema.md)
- Reality: 36 cards in seeds

---

## ARCHITECTURAL INCONSISTENCIES

### REST + WebSocket Dual Implementation

**Problem**: Same operations implemented BOTH via REST and WebSocket, but documentation only describes WebSocket.

**Operations with dual implementation**:
- Equip card: `POST /api/v1/games/:gameId/equip` AND `equip_card` socket event
- Unequip card: REST endpoint AND socket event
- Discard card: REST endpoint AND socket event
- Attack: REST endpoint AND socket event
- Upgrade slot: REST endpoint AND socket event

**Documentation**: Only describes WebSocket approach.

**Recommendation**: Document the hybrid approach or choose one.

---

## SUMMARY STATISTICS

| Document | Total Lines | Correct | Outdated | Incorrect | Missing | Accuracy |
|----------|-------------|---------|----------|-----------|---------|----------|
| architecture.md | 728 | 437 | 109 | 146 | 36 | 60% |
| database-schema.md | 1148 | 976 | 57 | 69 | 46 | 85% |
| websocket-events.md | 1071 | 354 | 289 | 428 | 0 | 33% |

**Total documentation**: 2,947 lines
**Needs correction**: 1,205 lines (41%)

---

## RECOMMENDED ACTIONS

### IMMEDIATE (This Sprint)
1. ✅ **Rewrite websocket-events.md** - Match actual event names and payloads
2. ✅ **Fix architecture.md service methods** - Document actual implementations
3. ✅ **Fix database-schema.md critical fields** - players.guest_id, slot_upgrades.capacity

### NEXT SPRINT
4. Document Repository methods comprehensively
5. Add error codes reference section
6. Document REST + WebSocket dual implementation pattern

### FUTURE
7. Implement missing features OR remove from docs (health endpoints, idempotency, inventory cache)
8. Standardize event naming across client/server
9. Add integration tests for WebSocket events

---

## VALIDATION METHODOLOGY

**Tools Used**:
- Claude Code Explore agents (3 parallel validations)
- Thoroughness level: "very thorough"
- Cross-referenced against:
  - Source code (`src/services/*.js`, `src/repositories/*.js`, `src/websocket/*.js`)
  - Database migrations (`database/migrations/*.js`)
  - Client code (`client/src/providers/*.tsx`, `client/src/hooks/*.ts`)
  - Package dependencies (`package.json`)

**Date**: 2025-11-16
**Validator**: Claude Code
**Status**: Validation complete, corrections in progress
