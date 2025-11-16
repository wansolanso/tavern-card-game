# Architecture Diagrams

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Client<br/>React + Vite]
        MOBILE[Future: Mobile Client<br/>React Native]
    end

    subgraph "API Gateway"
        LB[Load Balancer<br/>Railway]
        REST[REST API<br/>Express]
        WS[WebSocket Server<br/>Socket.io]
    end

    subgraph "Service Layer"
        AUTH[Auth Service<br/>JWT Sessions]
        GAME[Game Service<br/>State Management]
        CARD[Card Service<br/>Inventory & Tavern]
        COMBAT[Combat Service<br/>Turn Resolution]
    end

    subgraph "Data Layer"
        REPO_GAME[Game Repository]
        REPO_CARD[Card Repository]
        REPO_PLAYER[Player Repository]
    end

    subgraph "Storage Layer"
        CACHE[(Redis Cache<br/>Session & Game State)]
        DB[(PostgreSQL<br/>Persistent Data)]
    end

    WEB -->|HTTP/WSS| LB
    MOBILE -.->|Future| LB

    LB --> REST
    LB --> WS

    REST --> AUTH
    REST --> GAME
    REST --> CARD
    REST --> COMBAT

    WS --> AUTH
    WS --> GAME

    GAME --> REPO_GAME
    CARD --> REPO_CARD
    COMBAT --> REPO_GAME
    AUTH --> REPO_PLAYER

    REPO_GAME --> DB
    REPO_GAME --> CACHE
    REPO_CARD --> CACHE
    REPO_PLAYER --> DB

    AUTH --> CACHE

    style WEB fill:#4CAF50
    style REST fill:#2196F3
    style WS fill:#2196F3
    style CACHE fill:#FF9800
    style DB fill:#9C27B0
```

## Request Flow Diagram

### REST Command Flow (State Changes)

```mermaid
sequenceDiagram
    participant C as Client
    participant R as REST API
    participant S as Service
    participant D as Database
    participant Cache as Redis
    participant WS as WebSocket

    C->>R: POST /games/{id}/combat
    R->>R: Authenticate JWT
    R->>R: Validate Request
    R->>S: executeCombat(gameId)
    S->>D: BEGIN TRANSACTION
    S->>D: Lock game row
    S->>D: Update combat state
    S->>D: Update player HP
    S->>D: Add card to inventory
    D-->>S: Transaction committed
    S->>Cache: Update game cache
    S-->>R: CombatState
    R-->>C: 200 OK {combat}
    S->>WS: Broadcast combat:turn:executed
    WS-->>C: Event {combat update}
    WS-->>C: Event {game:state:updated}
```

### WebSocket State Synchronization

```mermaid
sequenceDiagram
    participant C1 as Client (Active)
    participant C2 as Client (Future: Spectator)
    participant WS as WebSocket Server
    participant S as Game Service
    participant Cache as Redis

    C1->>WS: connect()
    WS-->>C1: connected

    C1->>WS: auth:authenticate
    WS->>WS: Verify JWT
    WS-->>C1: auth:authenticated

    C1->>WS: game:join {gameId}
    WS->>S: getGame(gameId)
    S->>Cache: Check cache
    Cache-->>S: Game state
    WS-->>C1: game:joined
    WS-->>C1: game:state {full state}

    Note over C1,WS: Game state change via REST

    S->>WS: broadcast to room
    WS-->>C1: game:state:updated {delta}
    WS-->>C2: game:state:updated {delta}
```

## Service Boundary Diagram

```mermaid
graph LR
    subgraph "Game Service Boundary"
        GS[Game Service]
        GS_CREATE[Create Game]
        GS_LOAD[Load Game]
        GS_UPDATE[Update State]
        GS_END[End Game]

        GS --> GS_CREATE
        GS --> GS_LOAD
        GS --> GS_UPDATE
        GS --> GS_END
    end

    subgraph "Card Service Boundary"
        CS[Card Service]
        CS_EQUIP[Equip Card]
        CS_UNEQUIP[Unequip Card]
        CS_DISCARD[Discard Card]
        CS_TAVERN[Manage Tavern]

        CS --> CS_EQUIP
        CS --> CS_UNEQUIP
        CS --> CS_DISCARD
        CS --> CS_TAVERN
    end

    subgraph "Combat Service Boundary"
        CB[Combat Service]
        CB_INIT[Initiate Combat]
        CB_TURN[Execute Turn]
        CB_CALC[Calculate Damage]
        CB_RET[Retaliation]

        CB --> CB_INIT
        CB --> CB_TURN
        CB --> CB_CALC
        CB --> CB_RET
    end

    GS_CREATE --> CS_TAVERN
    GS_END --> CS_TAVERN

    CB_INIT --> GS_UPDATE
    CB_TURN --> GS_UPDATE
    CB_TURN --> CS_EQUIP

    CS_EQUIP --> GS_UPDATE
    CS_DISCARD --> GS_UPDATE

    style GS fill:#4CAF50
    style CS fill:#2196F3
    style CB fill:#FF5722
```

## Data Flow Diagram

```mermaid
flowchart TD
    START([Player Action])

    START --> AUTH{Authenticated?}
    AUTH -->|No| REJECT[401 Unauthorized]
    AUTH -->|Yes| VALIDATE{Valid Request?}

    VALIDATE -->|No| BAD_REQ[400 Bad Request]
    VALIDATE -->|Yes| CHECK_CACHE{In Cache?}

    CHECK_CACHE -->|Yes| CACHE_HIT[Return Cached Data]
    CHECK_CACHE -->|No| DB_QUERY[Query Database]

    DB_QUERY --> CACHE_UPDATE[Update Cache]
    CACHE_UPDATE --> PROCESS[Process Business Logic]

    PROCESS --> STATE_CHANGE{State Changed?}
    STATE_CHANGE -->|No| RESPONSE[Return Response]
    STATE_CHANGE -->|Yes| PERSIST[Persist to DB]

    PERSIST --> UPDATE_CACHE[Update Cache]
    UPDATE_CACHE --> BROADCAST[Broadcast WebSocket Event]
    BROADCAST --> RESPONSE

    RESPONSE --> END([End])

    REJECT --> END
    BAD_REQ --> END
    CACHE_HIT --> END

    style START fill:#4CAF50
    style PROCESS fill:#2196F3
    style PERSIST fill:#FF9800
    style BROADCAST fill:#9C27B0
    style END fill:#4CAF50
```

## Combat Resolution Flow

```mermaid
flowchart TD
    START([Player Initiates Combat])

    START --> VALIDATE_TARGET{Target in Tavern?}
    VALIDATE_TARGET -->|No| ERROR[409 Invalid Target]
    VALIDATE_TARGET -->|Yes| CHECK_COMBAT{Combat Active?}

    CHECK_COMBAT -->|Yes| ERROR2[409 Combat Already Active]
    CHECK_COMBAT -->|No| CALC_STATS[Calculate Player Stats]

    CALC_STATS --> INIT_COMBAT[Initialize Combat State]
    INIT_COMBAT --> SAVE_STATE[Save Combat State]
    SAVE_STATE --> BROADCAST_INIT[Broadcast: combat:initiated]

    BROADCAST_INIT --> WAIT_TURN([Wait for Player Attack])

    WAIT_TURN --> ATTACK[Execute Attack]
    ATTACK --> CALC_DMG[Calculate Damage]
    CALC_DMG --> APPLY_DMG[Apply Damage to Enemy]

    APPLY_DMG --> ENEMY_ALIVE{Enemy HP > 0?}

    ENEMY_ALIVE -->|No| VICTORY[Combat Victory]
    ENEMY_ALIVE -->|Yes| RETALIATE[Enemy Retaliates]

    RETALIATE --> APPLY_RET[Apply Retaliation Damage]
    APPLY_RET --> REGEN_SHIELD[Regenerate Enemy Shield]

    REGEN_SHIELD --> PLAYER_ALIVE{Player HP > 0?}
    PLAYER_ALIVE -->|No| DEFEAT[Combat Defeat]
    PLAYER_ALIVE -->|Yes| BROADCAST_TURN[Broadcast: combat:turn:executed]

    BROADCAST_TURN --> WAIT_TURN

    VICTORY --> ADD_CARD[Add Card to Reserve]
    ADD_CARD --> REPLENISH[Replenish Tavern]
    REPLENISH --> END_COMBAT[End Combat]

    DEFEAT --> GAME_OVER[Game Over]

    END_COMBAT --> BROADCAST_END[Broadcast: combat:ended]
    BROADCAST_END --> PHASE_TAVERN[Phase: Tavern]

    GAME_OVER --> BROADCAST_DEFEAT[Broadcast: game:defeat]

    ERROR --> END([End])
    ERROR2 --> END
    PHASE_TAVERN --> END
    BROADCAST_DEFEAT --> END

    style START fill:#4CAF50
    style VICTORY fill:#4CAF50
    style DEFEAT fill:#F44336
    style ADD_CARD fill:#2196F3
    style REPLENISH fill:#FF9800
```

## Caching Architecture

```mermaid
graph TB
    subgraph "Cache Layers"
        L1[L1: Card Database Cache<br/>TTL: No expiration<br/>Pattern: Cache-Aside]
        L2[L2: Game State Cache<br/>TTL: 1 hour sliding<br/>Pattern: Write-Through]
        L3[L3: Session Cache<br/>TTL: 24 hours<br/>Pattern: Write-Through]
    end

    subgraph "Cache Operations"
        READ[Read Operation]
        WRITE[Write Operation]
    end

    subgraph "Storage"
        REDIS[(Redis)]
        DB[(PostgreSQL)]
    end

    READ --> CHECK{Cache Hit?}
    CHECK -->|Yes| RETURN[Return Data]
    CHECK -->|No| DB_READ[Read from DB]
    DB_READ --> POPULATE[Populate Cache]
    POPULATE --> RETURN

    WRITE --> DB_WRITE[Write to DB]
    DB_WRITE --> INVALIDATE[Update/Invalidate Cache]
    INVALIDATE --> RETURN_WRITE[Return Success]

    L1 --> REDIS
    L2 --> REDIS
    L3 --> REDIS

    DB_READ --> DB
    DB_WRITE --> DB

    style L1 fill:#4CAF50
    style L2 fill:#2196F3
    style L3 fill:#FF9800
    style REDIS fill:#F44336
    style DB fill:#9C27B0
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as REST API
    participant Auth as Auth Service
    participant Redis as Redis Cache
    participant JWT as JWT Library

    Note over C,JWT: Guest Session Creation

    C->>API: POST /auth/guest
    API->>Auth: createGuestSession()
    Auth->>Auth: Generate player ID
    Auth->>JWT: Sign JWT token
    JWT-->>Auth: JWT token
    Auth->>Redis: Store session<br/>Key: session:{playerId}<br/>TTL: 24h
    Redis-->>Auth: OK
    Auth-->>API: {playerId, token, expiresAt}
    API-->>C: 201 Created {session}

    Note over C,JWT: Authenticated Request

    C->>API: GET /games/{id}<br/>Authorization: Bearer {token}
    API->>Auth: verifyToken(token)
    Auth->>JWT: Verify signature
    JWT-->>Auth: Payload
    Auth->>Redis: Check session exists
    Redis-->>Auth: Session valid
    Auth-->>API: {playerId}
    API->>API: Attach playerId to request
    API->>API: Process request
    API-->>C: 200 OK {game}
```

## Deployment Architecture (Railway)

```mermaid
graph TB
    subgraph "Internet"
        USER[Users]
        VERCEL[Vercel CDN<br/>Frontend]
    end

    subgraph "Railway Platform"
        subgraph "Backend Service"
            API[Node.js API<br/>Express + Socket.io]
            HEALTH[Health Checks]
        end

        subgraph "Database Service"
            PG[(PostgreSQL 15<br/>Persistent Storage)]
        end

        subgraph "Cache Service"
            REDIS[(Redis 7<br/>Session & Cache)]
        end
    end

    subgraph "GitHub"
        REPO[Repository]
        ACTIONS[GitHub Actions<br/>CI/CD]
    end

    USER --> VERCEL
    VERCEL --> API
    USER -.WebSocket.-> API

    API --> PG
    API --> REDIS

    HEALTH --> API

    REPO --> ACTIONS
    ACTIONS -->|Deploy| API
    ACTIONS -->|Migrate| PG

    style USER fill:#4CAF50
    style API fill:#2196F3
    style PG fill:#9C27B0
    style REDIS fill:#FF9800
    style VERCEL fill:#000000,color:#fff
```

## Error Handling Flow

```mermaid
flowchart TD
    START([Request])

    START --> TRY{Try}

    TRY -->|Success| RESPONSE[Return Response]
    TRY -->|Error| CHECK_TYPE{Error Type?}

    CHECK_TYPE -->|AppError| KNOWN[Known Application Error]
    CHECK_TYPE -->|Other| UNKNOWN[Unexpected Error]

    KNOWN --> LOG_KNOWN{Severity?}
    LOG_KNOWN -->|4xx| LOG_WARN[Log Warning]
    LOG_KNOWN -->|5xx| LOG_ERROR[Log Error + Stack]

    LOG_WARN --> FORMAT_KNOWN[Format Error Response]
    LOG_ERROR --> FORMAT_KNOWN

    FORMAT_KNOWN --> SEND_KNOWN[Send Error Response<br/>Status: error.statusCode]

    UNKNOWN --> LOG_CRITICAL[Log Critical Error<br/>+ Stack Trace]
    LOG_CRITICAL --> FORMAT_UNKNOWN[Format Generic Error]
    FORMAT_UNKNOWN --> SEND_UNKNOWN[Send 500 Response]

    RESPONSE --> END([End])
    SEND_KNOWN --> END
    SEND_UNKNOWN --> END

    style START fill:#4CAF50
    style KNOWN fill:#FF9800
    style UNKNOWN fill:#F44336
    style END fill:#4CAF50
```

## Future Multiplayer Architecture (Post-MVP)

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Clients]
        MOBILE[Mobile Clients]
    end

    subgraph "API Gateway Layer"
        KONG[Kong API Gateway<br/>Rate Limiting & Auth]
    end

    subgraph "Microservices"
        AUTH_MS[Auth Service<br/>User Accounts]
        GAME_MS[Game Service<br/>PvE Logic]
        MATCH_MS[Matchmaking Service<br/>PvP Matching]
        PVP_MS[PvP Service<br/>Real-time Combat]
        LEADER_MS[Leaderboard Service<br/>Rankings]
    end

    subgraph "Event Bus"
        KAFKA[Kafka<br/>Event Streaming]
    end

    subgraph "Data Layer"
        DB_AUTH[(User DB)]
        DB_GAME[(Game DB)]
        DB_PVP[(PvP DB)]
        REDIS_SHARED[(Redis Cluster<br/>Shared Cache)]
    end

    WEB --> KONG
    MOBILE --> KONG

    KONG --> AUTH_MS
    KONG --> GAME_MS
    KONG --> MATCH_MS
    KONG --> PVP_MS
    KONG --> LEADER_MS

    AUTH_MS --> KAFKA
    GAME_MS --> KAFKA
    MATCH_MS --> KAFKA
    PVP_MS --> KAFKA

    KAFKA --> LEADER_MS

    AUTH_MS --> DB_AUTH
    GAME_MS --> DB_GAME
    PVP_MS --> DB_PVP

    AUTH_MS --> REDIS_SHARED
    GAME_MS --> REDIS_SHARED
    PVP_MS --> REDIS_SHARED

    style KONG fill:#4CAF50
    style KAFKA fill:#000000,color:#fff
    style REDIS_SHARED fill:#FF9800
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-15
**Purpose:** Visual representation of system architecture
