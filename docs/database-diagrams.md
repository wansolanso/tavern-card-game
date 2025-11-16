# Tavern Card Game - Database Diagrams

## Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    players ||--o{ games : creates
    players ||--o{ sessions : has
    games ||--o{ game_cards : owns
    games ||--o{ tavern_cards : displays
    games ||--o{ combats : participates
    games ||--o{ slot_upgrades : has
    cards ||--o{ game_cards : references
    cards ||--o{ tavern_cards : spawns
    cards ||--o{ card_abilities : defines
    abilities ||--o{ card_abilities : belongs_to
    combats ||--o{ combat_events : logs

    players {
        uuid id PK
        timestamp created_at
        timestamp last_seen_at
    }

    sessions {
        uuid id PK
        uuid player_id FK
        string token UK
        timestamp expires_at
        timestamp created_at
    }

    games {
        uuid id PK
        uuid player_id FK
        string status
        integer current_turn
        string phase
        integer player_current_hp
        integer player_max_hp
        boolean boss_defeated
        integer version
        timestamp created_at
        timestamp updated_at
    }

    cards {
        string id PK
        string name
        text description
        integer hp
        integer shield
        string rarity
        boolean is_boss
        string image_url
        timestamp created_at
    }

    abilities {
        string id PK
        string name
        text description
        string type
        integer power
        jsonb effects
        timestamp created_at
    }

    card_abilities {
        uuid id PK
        string card_id FK
        string ability_id FK
        string ability_type
    }

    game_cards {
        uuid id PK
        uuid game_id FK
        string card_id FK
        string location
        string slot_type
        integer slot_position
        timestamp acquired_at
    }

    tavern_cards {
        uuid id PK
        uuid game_id FK
        string card_id FK
        integer position
        integer current_hp
        integer current_shield
        timestamp created_at
    }

    slot_upgrades {
        uuid id PK
        uuid game_id FK
        string slot_type
        boolean is_upgraded
        timestamp upgraded_at
    }

    combats {
        uuid id PK
        uuid game_id FK
        string target_card_id FK
        integer target_current_hp
        integer target_current_shield
        integer turn
        jsonb player_stats
        string status
        timestamp started_at
        timestamp ended_at
    }

    combat_events {
        uuid id PK
        uuid combat_id FK
        integer turn
        string actor
        string action
        jsonb result
        timestamp created_at
    }
```

---

## Database Schema Layers

```mermaid
graph TB
    subgraph "Authentication Layer"
        A[players]
        B[sessions]
    end

    subgraph "Card Catalog Layer (Static)"
        C[cards]
        D[abilities]
        E[card_abilities]
    end

    subgraph "Game State Layer"
        F[games]
        G[game_cards]
        H[tavern_cards]
        I[slot_upgrades]
    end

    subgraph "Combat Layer"
        J[combats]
        K[combat_events]
    end

    A --> F
    A --> B
    C --> E
    D --> E
    C --> G
    C --> H
    E --> G
    F --> G
    F --> H
    F --> I
    F --> J
    C --> J
    J --> K

    style A fill:#e1f5ff
    style B fill:#e1f5ff
    style C fill:#fff4e1
    style D fill:#fff4e1
    style E fill:#fff4e1
    style F fill:#e8f5e9
    style G fill:#e8f5e9
    style H fill:#e8f5e9
    style I fill:#e8f5e9
    style J fill:#ffe1e1
    style K fill:#ffe1e1
```

---

## Data Flow: Game State Load

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB
    participant Cache

    Client->>API: GET /api/v1/games/{gameId}
    API->>Cache: Check game:{gameId}
    alt Cache Hit
        Cache-->>API: Return cached state
    else Cache Miss
        API->>DB: SELECT FROM games WHERE id = ?
        API->>DB: SELECT equipped cards + abilities
        API->>DB: SELECT reserve cards
        API->>DB: SELECT tavern cards + abilities
        API->>DB: SELECT slot upgrades
        API->>DB: SELECT active combat
        DB-->>API: Return all data
        API->>Cache: Store game:{gameId}
    end
    API-->>Client: Return complete game state
```

---

## Data Flow: Combat Resolution

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB

    Client->>API: POST /api/v1/games/{gameId}/combat/attack
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT combat FOR UPDATE
    API->>DB: UPDATE tavern_cards (apply damage)
    API->>DB: INSERT combat_events (player attack)

    alt Enemy Defeated
        API->>DB: INSERT game_cards (acquire card)
        API->>DB: DELETE tavern_cards (remove defeated)
        API->>DB: INSERT tavern_cards (replenish)
        API->>DB: UPDATE combats (status = victory)
        API->>DB: UPDATE games (phase = tavern)
    else Enemy Alive
        API->>DB: UPDATE combats (reduce player HP)
        API->>DB: INSERT combat_events (enemy retaliate)
        alt Player Defeated
            API->>DB: UPDATE combats (status = defeat)
            API->>DB: UPDATE games (phase = defeat)
        else Combat Continues
            API->>DB: UPDATE combats (turn = turn + 1)
        end
    end

    API->>DB: COMMIT TRANSACTION
    API-->>Client: Return combat result
```

---

## Data Model: Card Inventory System

```mermaid
graph LR
    subgraph "Card Catalog (Static)"
        A[cards table]
        B[abilities table]
        C[card_abilities table]
    end

    subgraph "Player Inventory (Dynamic)"
        D[game_cards table]
    end

    subgraph "Inventory Locations"
        E[Reserve<br/>location = 'reserve']
        F[Equipped<br/>location = 'equipped']
    end

    subgraph "Equipment Slots"
        G[HP Slot]
        H[Shield Slot]
        I[Special Slot]
        J[Passive Slot]
        K[Normal Slot]
    end

    A --> C
    B --> C
    A --> D
    D --> E
    D --> F
    F --> G
    F --> H
    F --> I
    F --> J
    F --> K

    style A fill:#fff4e1
    style B fill:#fff4e1
    style C fill:#fff4e1
    style D fill:#e8f5e9
    style E fill:#e1f5ff
    style F fill:#e1f5ff
    style G fill:#ffe1e1
    style H fill:#ffe1e1
    style I fill:#ffe1e1
    style J fill:#ffe1e1
    style K fill:#ffe1e1
```

---

## Data Model: Tavern Card Pool

```mermaid
graph TB
    subgraph "Tavern System"
        A[tavern_cards table<br/>9 active cards]
        B[Position 0<br/>Card ID + Current HP/Shield]
        C[Position 1]
        D[Position 2]
        E[Position 3]
        F[Position 4]
        G[Position 5]
        H[Position 6]
        I[Position 7]
        J[Position 8]
    end

    subgraph "Card Lifecycle"
        K[Spawn<br/>From card catalog]
        L[Combat<br/>Take damage]
        M[Defeat<br/>Remove from tavern]
        N[Replenish<br/>New random card]
    end

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    A --> J

    K --> A
    B --> L
    L --> M
    M --> N
    N --> K

    style A fill:#e8f5e9
    style K fill:#fff4e1
    style L fill:#ffe1e1
    style M fill:#ffcccc
    style N fill:#e1f5ff
```

---

## Data Model: Slot Upgrade System

```mermaid
stateDiagram-v2
    [*] --> SingleSlot: Game starts
    SingleSlot --> UpgradeDecision: Player discards card
    UpgradeDecision --> DualSlot: Upgrade succeeds
    DualSlot --> [*]: Slot now holds 2 cards

    state SingleSlot {
        [*] --> Empty
        Empty --> Occupied: Equip card (position 0)
        Occupied --> Empty: Unequip card
    }

    state DualSlot {
        [*] --> Position0Empty
        Position0Empty --> Position0Occupied: Equip to position 0
        Position0Occupied --> BothOccupied: Equip to position 1
        BothOccupied --> Position0Occupied: Unequip position 1
        Position0Occupied --> Position0Empty: Unequip position 0
    }

    note right of UpgradeDecision
        Row inserted in slot_upgrades table
        is_upgraded = TRUE
    end note

    note right of SingleSlot
        game_cards WHERE slot_type = 'hp'
        AND location = 'equipped'
        COUNT = 0 or 1
    end note

    note right of DualSlot
        game_cards WHERE slot_type = 'hp'
        AND location = 'equipped'
        COUNT = 0, 1, or 2
    end note
```

---

## Index Strategy Visualization

```mermaid
graph TB
    subgraph "Primary Indexes (B-Tree)"
        A[players.id]
        B[games.id]
        C[cards.id]
        D[combats.id]
    end

    subgraph "Foreign Key Indexes"
        E[games.player_id]
        F[game_cards.game_id]
        G[tavern_cards.game_id]
        H[combats.game_id]
    end

    subgraph "Composite Indexes"
        I[games: player_id + status]
        J[game_cards: game_id + slot_type + slot_position]
        K[combats: game_id + status]
    end

    subgraph "JSONB Indexes (GIN)"
        L[abilities.effects]
        M[combats.player_stats]
        N[combat_events.result]
    end

    subgraph "Partial Indexes"
        O[game_cards: equipped slots only]
        P[combats: active combats only]
    end

    style A fill:#e1f5ff
    style B fill:#e1f5ff
    style C fill:#e1f5ff
    style D fill:#e1f5ff
    style E fill:#fff4e1
    style F fill:#fff4e1
    style G fill:#fff4e1
    style H fill:#fff4e1
    style I fill:#e8f5e9
    style J fill:#e8f5e9
    style K fill:#e8f5e9
    style L fill:#ffe1e1
    style M fill:#ffe1e1
    style N fill:#ffe1e1
    style O fill:#f3e5f5
    style P fill:#f3e5f5
```

---

## Query Performance Breakdown

```mermaid
gantt
    title Load Complete Game State (Parallel Queries)
    dateFormat X
    axisFormat %L ms

    section Database Queries
    Get game metadata           :a1, 0, 10
    Get equipped cards          :a2, 0, 30
    Get reserve cards           :a3, 0, 20
    Get tavern cards            :a4, 0, 40
    Get slot upgrades           :a5, 0, 15
    Get active combat           :a6, 0, 10

    section Total Time
    All queries complete        :milestone, 40, 0

    section Cache Operations
    Store in Redis              :b1, 40, 10
    Return to client            :milestone, 50, 0
```

**Notes:**
- Queries run in parallel using `Promise.all`
- Slowest query (tavern cards with abilities) determines total time
- Total time: ~40-50ms (database) + ~10ms (cache) = ~60ms

---

## Database Size Estimation

```mermaid
pie title Estimated Database Size (1000 Players)
    "cards (42 cards)" : 10
    "abilities (35 abilities)" : 5
    "card_abilities (130 mappings)" : 5
    "players (1000 players)" : 50
    "sessions (500 active)" : 25
    "games (2000 games)" : 200
    "game_cards (50k inventory)" : 500
    "tavern_cards (18k cards)" : 180
    "slot_upgrades (5k upgrades)" : 25
    "combats (10k combats)" : 100
    "combat_events (100k events)" : 500
```

**Total Estimated Size:** ~1.6 GB for 1000 active players

**Growth Rate:**
- Per new player: ~1.6 MB
- Per new game: ~250 KB
- Per combat: ~10 KB

---

## Backup & Recovery Flow

```mermaid
sequenceDiagram
    participant DB as PostgreSQL
    participant Backup as Backup System
    participant Storage as Cold Storage
    participant Recovery as Recovery System

    loop Daily Full Backup
        DB->>Backup: pg_dump -Fc
        Backup->>Storage: Upload backup_YYYYMMDD.dump
    end

    loop Hourly WAL Archive
        DB->>Backup: Archive WAL segments
        Backup->>Storage: Upload WAL files
    end

    Note over DB,Storage: Disaster Recovery Scenario

    Recovery->>Storage: Fetch latest full backup
    Storage-->>Recovery: backup_20251115.dump
    Recovery->>DB: pg_restore
    Recovery->>Storage: Fetch WAL files since backup
    Storage-->>Recovery: WAL segments
    Recovery->>DB: Apply WAL logs (PITR)
    DB-->>Recovery: Database restored to point-in-time
```

---

## Concurrency Control Strategy

```mermaid
sequenceDiagram
    participant Client1
    participant Client2
    participant API1
    participant API2
    participant DB

    Client1->>API1: Equip card (version 1)
    Client2->>API2: Equip card (version 1)

    par Concurrent Operations
        API1->>DB: BEGIN TRANSACTION
        API1->>DB: SELECT version FROM games WHERE id = X
        API1->>DB: (version = 1, OK)
        API1->>DB: UPDATE games SET version = 2 WHERE id = X AND version = 1
    and
        API2->>DB: BEGIN TRANSACTION
        API2->>DB: SELECT version FROM games WHERE id = X
        API2->>DB: (version = 1, OK)
        API2->>DB: UPDATE games SET version = 2 WHERE id = X AND version = 1
    end

    DB-->>API1: Updated 1 row (SUCCESS)
    DB-->>API2: Updated 0 rows (CONFLICT)

    API1->>DB: COMMIT
    API1-->>Client1: 200 OK (card equipped)

    API2->>DB: ROLLBACK
    API2-->>Client2: 409 Conflict (retry required)

    Note over Client2,API2: Client retries with version 2
    Client2->>API2: Equip card (retry)
    API2->>DB: BEGIN TRANSACTION
    API2->>DB: SELECT version FROM games WHERE id = X
    API2->>DB: (version = 2, OK)
    API2->>DB: UPDATE games SET version = 3 WHERE id = X AND version = 2
    DB-->>API2: Updated 1 row (SUCCESS)
    API2->>DB: COMMIT
    API2-->>Client2: 200 OK (card equipped)
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-15
**Status:** Database design visualization complete
