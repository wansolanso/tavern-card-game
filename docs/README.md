# Tavern Card Game - Backend Architecture Documentation

## Quick Navigation

This directory contains the complete backend architecture design for the Tavern Card Game MVP.

### Core Documents

1. **[architecture.md](./architecture.md)** - Complete architecture overview
   - Service architecture and boundaries
   - State management strategy
   - Data flow patterns
   - Caching strategy
   - Authentication and security
   - Error handling standards
   - Database access patterns
   - Resilience patterns
   - Observability
   - Future considerations
   - Technology stack
   - Configuration management
   - Deployment strategy

2. **[api-specification.yaml](./api-specification.yaml)** - OpenAPI 3.0 REST API specification
   - Complete REST endpoint specifications
   - Request/response schemas
   - Authentication flows
   - Error response formats
   - Example requests and responses
   - Import into Swagger UI or Postman for interactive documentation

3. **[websocket-events.md](./websocket-events.md)** - WebSocket event specifications
   - Socket.io event definitions
   - Authentication events
   - Game room management
   - Combat events
   - Card management events
   - Tavern events
   - Victory/defeat events
   - Client and server implementation examples
   - Event flow diagrams
   - Rate limiting
   - Error handling

4. **[implementation-guide.md](./implementation-guide.md)** - Complete implementation patterns
   - Authentication and session management (JWT, Redis)
   - Caching strategy and implementation (Cache-Aside, Write-Through)
   - Error handling standards (AppError classes, middleware)
   - Database access patterns (Repository pattern, transactions)
   - Middleware and request pipeline
   - Code examples for all patterns

5. **[architecture-diagrams.md](./architecture-diagrams.md)** - Visual architecture diagrams
   - System architecture overview
   - Request flow diagrams (REST and WebSocket)
   - Service boundary diagram
   - Data flow diagram
   - Combat resolution flow
   - Caching architecture
   - Authentication flow
   - Deployment architecture (Railway)
   - Error handling flow
   - Future multiplayer architecture

### Summary Document

- **[CHANGELOG.md](../CHANGELOG.md)** - Architecture decisions and bulletpoints
  - All architectural decisions in one place
  - Technology stack summary
  - Key trade-offs and rationale
  - Documentation index

## Implementation Checklist

Use this checklist when implementing the backend:

### Phase 1: Project Setup
- [ ] Initialize Node.js project with TypeScript
- [ ] Install dependencies (Express, Socket.io, Knex, Redis, JWT, Zod, Winston)
- [ ] Set up project structure (services, repositories, middleware, routes)
- [ ] Configure environment variables
- [ ] Set up linting and formatting (ESLint, Prettier)

### Phase 2: Database Layer
- [ ] Design database schema (defer to database-architect)
- [ ] Create Knex migrations
- [ ] Implement repositories (GameRepository, CardRepository, PlayerRepository)
- [ ] Set up connection pooling
- [ ] Create seed data for card catalog

### Phase 3: Core Services
- [ ] Implement AuthService (JWT generation, verification)
- [ ] Implement CardService (card CRUD, caching)
- [ ] Implement GameService (game lifecycle, state management)
- [ ] Implement CombatService (turn resolution, damage calculation)
- [ ] Set up Redis client and cache helpers

### Phase 4: API Layer
- [ ] Create REST routes (auth, games, cards, combat, tavern, health)
- [ ] Implement authentication middleware
- [ ] Implement validation middleware (Zod schemas)
- [ ] Implement error handler middleware
- [ ] Implement rate limiting
- [ ] Set up request ID middleware

### Phase 5: WebSocket Layer
- [ ] Set up Socket.io server
- [ ] Implement authentication for WebSocket connections
- [ ] Implement game room management
- [ ] Implement event handlers (combat, cards, tavern)
- [ ] Implement state broadcast logic
- [ ] Set up reconnection handling

### Phase 6: Error Handling & Logging
- [ ] Create AppError classes
- [ ] Set up Winston logger with structured logging
- [ ] Implement correlation IDs (request ID, game ID, player ID)
- [ ] Configure log levels and output formats
- [ ] Set up HTTP request logging (Morgan)

### Phase 7: Testing
- [ ] Set up Jest for unit testing
- [ ] Write unit tests for services
- [ ] Set up Supertest for integration testing
- [ ] Write integration tests for REST endpoints
- [ ] Write WebSocket tests with socket.io-client
- [ ] Set up test database and test fixtures

### Phase 8: Deployment
- [ ] Create Dockerfile
- [ ] Set up Railway project
- [ ] Configure environment variables in Railway
- [ ] Set up PostgreSQL and Redis on Railway
- [ ] Configure GitHub Actions CI/CD
- [ ] Test health checks
- [ ] Deploy to Railway
- [ ] Verify deployment with smoke tests

## API Testing

### Using Swagger UI

1. Copy `api-specification.yaml` content
2. Go to [Swagger Editor](https://editor.swagger.io/)
3. Paste the specification
4. Explore endpoints interactively

### Using Postman

1. Import `api-specification.yaml` into Postman
2. Create environment with variables:
   - `BASE_URL`: `http://localhost:3000/api/v1` (dev)
   - `AUTH_TOKEN`: (generated from `/auth/guest`)
3. Test endpoints with collection runner

### Example cURL Commands

```bash
# Create guest session
curl -X POST http://localhost:3000/api/v1/auth/guest

# Create new game
curl -X POST http://localhost:3000/api/v1/games \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Get game state
curl -X GET http://localhost:3000/api/v1/games/{gameId} \
  -H "Authorization: Bearer YOUR_TOKEN"

# Initiate combat
curl -X POST http://localhost:3000/api/v1/games/{gameId}/combat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"targetCardId": "card_001"}'
```

## WebSocket Testing

### Using Socket.io Client (JavaScript)

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);

  socket.emit('game:join', { gameId: 'game_123' });
});

socket.on('game:state', (data) => {
  console.log('Game state:', data.game);
});
```

### Using WebSocket CLI Tools

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket server
wscat -c ws://localhost:3000 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send events
> {"event": "game:join", "data": {"gameId": "game_123"}}
```

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npm run migrate:latest

# Seed card database
npm run seed:cards

# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run type-check
```

## Architecture Principles

1. **Clear Service Boundaries**: Each service has a single responsibility
2. **Repository Pattern**: Data access abstraction for testability
3. **Caching Strategy**: Multi-layer caching for performance
4. **Error Handling**: Consistent error responses with proper codes
5. **Observability**: Structured logging with correlation IDs
6. **Security**: JWT authentication, rate limiting, input validation
7. **Resilience**: Graceful degradation, retries, health checks
8. **Testability**: Dependency injection, clear interfaces
9. **Scalability**: Stateless design, horizontal scaling ready
10. **Future-Ready**: Modular monolith enables microservices extraction

## Key Design Decisions

### Why Modular Monolith?
- Faster MVP development
- Simpler deployment and operations
- Lower infrastructure costs
- Clear service boundaries enable future extraction
- Good fit for single-player game

### Why REST + WebSocket?
- REST for commands (idempotent state changes)
- WebSocket for real-time updates (efficient push)
- Clear separation of concerns
- Well-understood patterns
- Easier to debug than GraphQL subscriptions

### Why JWT with Redis?
- Stateless API (horizontal scaling)
- Session validation and revocation support
- 24-hour expiration (security)
- Fast session lookup (Redis cache)
- Guest sessions (no registration required)

### Why Write-Through Caching?
- Consistency for active game state
- Immediate cache updates on writes
- Prevents stale data issues
- Acceptable write overhead for MVP

### Why Repository Pattern?
- Abstraction layer for database access
- Easier testing (mock repositories)
- Flexibility to change database
- Consistent data access patterns

## Next Steps

1. **Database Schema Design** - Defer to database-architect
   - Tables: games, players, cards, equipped_cards, tavern_cards, player_cards
   - Indexes for performance
   - Constraints for data integrity
   - Migration scripts

2. **Frontend Integration** - After backend implementation
   - React components consuming REST API
   - Zustand store for state management
   - WebSocket integration for real-time updates
   - Optimistic UI updates

3. **Testing Strategy** - During implementation
   - Unit tests for services and repositories
   - Integration tests for API endpoints
   - WebSocket event tests
   - End-to-end game flow tests

4. **Deployment** - After testing
   - Railway deployment configuration
   - CI/CD pipeline setup
   - Environment variable management
   - Health check monitoring

## Support

For questions or clarifications about the architecture:
- Review the specific document for detailed information
- Check `CHANGELOG.md` for decision rationale
- Refer to `implementation-guide.md` for code examples

---

**Architecture Version:** 1.0
**Last Updated:** 2025-11-15
**Status:** Ready for Implementation
