# Tavern Card Game

A roguelike card battler where you build your deck by defeating tavern cards and face powerful bosses.

## Tech Stack

### Backend
- **Node.js 20+** with Express 4.x
- **Socket.io 4.x** for real-time WebSocket communication
- **SQLite** (development) / **PostgreSQL** (production)
- **Redis** for session management and caching
- **Knex.js** for database migrations and queries
- **JWT** for authentication
- **Zod** for validation

### Frontend
- **React 18+** with TypeScript
- **Vite** for fast development and optimized builds
- **Zustand** for state management
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **Socket.io Client** for real-time updates
- **Axios** for HTTP requests

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Installation

```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Setup database
npm run db:setup

# Start backend
npm run dev

# In another terminal, start frontend
cd client
npm run dev
```

Then open http://localhost:5173 in your browser.

For detailed instructions, see [QUICKSTART.md](./QUICKSTART.md)

## Project Structure

```
Dr Doomgadget/
├── src/                    # Backend source
│   ├── controllers/       # Request handlers
│   ├── services/         # Business logic
│   ├── repositories/     # Data access
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── websocket/        # Socket.io handlers
│   ├── config/           # Configuration
│   └── utils/            # Utilities
│
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── store/       # Zustand state
│   │   ├── hooks/       # Custom hooks
│   │   ├── types/       # TypeScript types
│   │   └── config/      # Frontend config
│   └── public/          # Static assets
│
├── database/             # Database files
│   ├── migrations/      # Knex migrations
│   └── seeds/           # Seed data
│
├── logs/                 # Application logs
└── docs/                 # Documentation
```

## Documentation

- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide
- [FRONTEND-IMPLEMENTATION.md](./FRONTEND-IMPLEMENTATION.md) - Frontend architecture
- [DATABASE-DESIGN-SUMMARY.md](./DATABASE-DESIGN-SUMMARY.md) - Database schema
- [frontend-architecture.md](./frontend-architecture.md) - Detailed frontend design
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Implementation notes
- [CHANGELOG.md](./CHANGELOG.md) - Architecture decisions log

## Game Flow

1. **Guest Login** - Auto-create guest account
2. **New Game** - Create game session
3. **Tavern Phase** - Attack tavern cards to collect them
4. **Equipment** - Equip cards to slots (HP, Shield, Special, Passive, Normal)
5. **Boss Fight** - Face powerful bosses
6. **Victory/Defeat** - Complete game cycle

## API Endpoints

### Authentication
- `POST /api/v1/auth/guest` - Create guest session

### Games
- `POST /api/v1/games` - Create new game
- `GET /api/v1/games` - List player's games
- `GET /api/v1/games/:id` - Get game state
- `POST /api/v1/games/:id/equip` - Equip card
- `POST /api/v1/games/:id/unequip` - Unequip card
- `POST /api/v1/games/:id/discard` - Discard card
- `POST /api/v1/games/:id/upgrade-slot` - Upgrade slot
- `POST /api/v1/games/:id/attack` - Attack tavern card

### Cards
- `GET /api/v1/cards` - Get card catalog
- `GET /api/v1/cards/:id` - Get specific card

### Health
- `GET /health` - Health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

## WebSocket Events

### Client → Server
- `action:attack:tavern` - Attack a tavern card
- `action:equip` - Equip card to slot
- `action:discard` - Discard card
- `action:upgrade` - Upgrade slot
- `action:ability` - Use ability
- `action:boss:ready` - Ready for boss fight

### Server → Client
- `game:state:update` - Game state changed
- `tavern:update` - Tavern cards updated
- `card:equipped` - Card equipped
- `combat:damage` - Damage dealt
- `boss:spawned` - Boss appeared
- `boss:attack` - Boss attacked
- `game:over` - Game ended
- `error` - Error occurred

## Development

### Backend
```bash
npm run dev              # Start dev server
npm run lint            # Run ESLint
npm run format          # Format code
npm test                # Run tests

# Database
npm run migrate:latest  # Apply migrations
npm run seed:run        # Seed database
npm run db:reset        # Reset database
```

### Frontend
```bash
cd client
npm run dev             # Start dev server
npm run build           # Build for production
npm run preview         # Preview build
npm run lint            # Run ESLint
```

## Features

### Implemented
- Guest authentication with JWT
- Game session creation and management
- WebSocket real-time communication
- Zustand state management
- Responsive UI with TailwindCSS
- Notification system
- Modal dialogs
- Loading states
- Basic game board layout

### In Development
- Drag-and-drop card system
- Combat animations
- Equipment slot functionality
- Boss fight mechanics
- Card collection screen
- Sound effects and music

### Planned
- Persistent game saves
- User accounts (OAuth)
- Leaderboards
- Achievements system
- Card unlocks and progression
- Custom game modes
- Multiplayer support

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
DATABASE_URL=./dev.sqlite3
REDIS_URL=redis://localhost:6379
```

### Frontend (client/.env.development)
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## Testing

```bash
# Backend tests
npm test

# Frontend tests
cd client
npm test
```

## Deployment

The application is designed to deploy to:
- **Backend**: Railway, Render, Heroku
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Database**: Railway PostgreSQL, Supabase
- **Redis**: Railway Redis, Upstash

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT

## Support

For issues, questions, or feature requests:
- Check the documentation in the `docs/` folder
- Review implementation notes in `IMPLEMENTATION.md`
- Check the changelog in `CHANGELOG.md`
