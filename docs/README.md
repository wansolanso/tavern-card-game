# Tavern Card Game - Documentation Index

## 📚 Quick Navigation

This directory contains the essential technical documentation for the Tavern Card Game project.

### 🎯 Core Documentation (Start Here)

1. **[../README.md](../README.md)** - Project overview, setup instructions, and getting started
2. **[../CHANGELOG.md](../CHANGELOG.md)** - Complete history of changes, fixes, and improvements

---

## 🏗️ Architecture & Design

### Backend Architecture
- **[architecture.md](./architecture.md)** - Complete backend architecture
  - Service boundaries and responsibilities
  - State management strategy
  - Caching strategy (Redis)
  - Authentication & security
  - Error handling standards
  - Database access patterns
  - Technology stack decisions

### Communication
- **[websocket-events.md](./websocket-events.md)** - WebSocket event specifications
  - Socket.io event definitions
  - Authentication events
  - Game room management
  - Combat, card, and tavern events
  - Client/server implementation examples
  - Rate limiting and error handling

---

## 💾 Database

- **[database-schema.md](./database-schema.md)** - Complete database design
  - Table schemas (players, games, cards, abilities)
  - Relationships and constraints
  - Indexes for performance
  - Migration scripts
  - Query patterns and optimizations

---

## 🛠️ Implementation

- **[implementation-guide.md](./implementation-guide.md)** - Implementation patterns
  - Authentication and session management (JWT + Redis)
  - Caching strategies (Cache-Aside, Write-Through)
  - Error handling patterns (AppError classes)
  - Database access patterns (Repository pattern)
  - Middleware and request pipeline
  - Code examples for all patterns

---

## 🧪 Testing & Quality

- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing strategy
  - Unit testing (Jest backend, Vitest frontend)
  - Integration testing
  - E2E testing
  - Test coverage requirements
  - Mocking strategies

---

## 🔒 Error Handling & Monitoring

- **[error-handling-guide.md](./error-handling-guide.md)** - Error handling standards
  - Error types and hierarchy
  - Error response format
  - Client-side error boundaries
  - Logging best practices

- **[ERROR_CODES.md](./ERROR_CODES.md)** - Error code reference
  - All standardized error codes
  - Error categories
  - Usage examples

- **[sentry-integration-guide.md](./sentry-integration-guide.md)** - Monitoring setup
  - Sentry integration
  - Error tracking
  - Performance monitoring
  - Alerting configuration

---

## 🎨 Frontend

- **[loading-states-guide.md](./loading-states-guide.md)** - Loading states
  - Loading state management
  - Skeleton screens
  - Error states
  - UI/UX best practices

---

## 📁 Documentation Structure

```
docs/
├── README.md (this file)           # Documentation index
├── architecture.md                 # Backend architecture
├── websocket-events.md             # WebSocket specifications
├── database-schema.md              # Database design
├── implementation-guide.md         # Implementation patterns
├── TESTING_GUIDE.md                # Testing strategy
├── error-handling-guide.md         # Error handling
├── ERROR_CODES.md                  # Error codes reference
├── sentry-integration-guide.md     # Monitoring setup
└── loading-states-guide.md         # Loading states
```

---

## 🗂️ Additional Resources

### Database
- **database/README.md** - Database migration and seeding guide
- **database/migrations/** - Knex migrations
- **database/seeds/** - Seed data (cards, abilities)

### Frontend
- **client/README.md** - Frontend-specific documentation
- **client/src/tests/** - Frontend test setup

---

## 📝 Documentation Maintenance

### Recently Consolidated (2025-11-16)

Removed **22 redundant documentation files** and consolidated information into core docs:

**Removed**:
- Migration reports (moved to CHANGELOG)
- Performance summaries (consolidated in CHANGELOG)
- Multiple error handling summaries (consolidated)
- Duplicate loading states guides (kept one)
- Database diagrams (consolidated in database-schema.md)
- Frontend architecture duplicates (consolidated in architecture.md)

**Result**: Cleaner structure, single source of truth, easier maintenance.

---

## 🔍 Finding Information

### Common Questions

**Q: How do I set up the project?**
→ See [../README.md](../README.md)

**Q: What changed recently?**
→ See [../CHANGELOG.md](../CHANGELOG.md)

**Q: How does authentication work?**
→ See [implementation-guide.md](./implementation-guide.md) - Authentication section

**Q: What are the database tables?**
→ See [database-schema.md](./database-schema.md)

**Q: How do WebSocket events work?**
→ See [websocket-events.md](./websocket-events.md)

**Q: What error codes exist?**
→ See [ERROR_CODES.md](./ERROR_CODES.md)

**Q: How do I write tests?**
→ See [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

**Documentation Version**: 2.0 (Consolidated)
**Last Updated**: 2025-11-16
**Status**: Production Ready
