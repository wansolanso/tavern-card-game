# Tavern Card Game - Quick Start Guide

## Prerequisites

- Node.js 20+ and npm 10+
- Git

## Installation

### 1. Clone and Install

```bash
# Navigate to project directory
cd Dr\ Doomgadget

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Environment Configuration

**Backend (.env in root):**
```bash
# Already configured - check .env file
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
DATABASE_URL=./dev.sqlite3
REDIS_URL=redis://localhost:6379
```

**Frontend (client/.env.development):**
```bash
# Already configured - check client/.env.development
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### 3. Database Setup

```bash
# Run migrations and seed data
npm run db:setup
```

## Running the Application

### Option 1: Run Both (Recommended)

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
npm run dev
```
Backend will start on http://localhost:3000

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Frontend will start on http://localhost:5173

### Option 2: Production Build

```bash
# Build frontend
cd client
npm run build
cd ..

# Serve both from backend (future)
npm start
```

## Verify Installation

1. Open browser to http://localhost:5173
2. You should see the Tavern Card Game lobby screen
3. Click "New Game" to start
4. Game board should load with tavern cards

## API Testing

### Check Backend Health
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T...",
  "uptime": 123.45,
  "environment": "development"
}
```

### Create Guest Session
```bash
curl -X POST http://localhost:3000/api/v1/auth/guest
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "playerId": "player_abc123",
  "expiresIn": "24h"
}
```

### Create New Game
```bash
# Replace YOUR_TOKEN with token from previous step
curl -X POST http://localhost:3000/api/v1/games \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## Directory Structure

```
Dr Doomgadget/
├── src/                      # Backend source code
│   ├── controllers/         # API controllers
│   ├── services/           # Business logic
│   ├── repositories/       # Data access
│   ├── routes/             # Express routes
│   ├── middleware/         # Express middleware
│   ├── websocket/          # Socket.io handlers
│   ├── config/             # Configuration
│   └── utils/              # Utilities
│
├── client/                  # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── store/         # Zustand state
│   │   ├── hooks/         # Custom hooks
│   │   ├── types/         # TypeScript types
│   │   └── config/        # Frontend config
│   └── public/            # Static assets
│
├── database/               # Database files
│   ├── migrations/        # Knex migrations
│   └── seeds/             # Seed data
│
├── logs/                   # Application logs
├── docs/                   # Documentation
│
├── package.json           # Backend dependencies
├── knexfile.js           # Database config
├── .env                  # Backend environment
└── .env.example          # Environment template
```

## Common Issues

### Port Already in Use

**Backend (3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**Frontend (5173):**
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### Database Issues

**Reset database:**
```bash
npm run db:reset
```

**Fresh start:**
```bash
npm run db:fresh
```

### WebSocket Connection Failed

1. Make sure backend is running
2. Check `.env.development` has correct WS_URL
3. Verify no CORS issues in browser console
4. Check firewall settings

### Module Not Found

```bash
# Backend
npm install

# Frontend
cd client
npm install
```

## Development Tips

### Hot Reload

- Backend: nodemon watches for changes automatically
- Frontend: Vite HMR updates instantly

### View Logs

```bash
# Backend logs
tail -f logs/server.log

# Or check console output
```

### Database Commands

```bash
# Create migration
npm run migrate:make migration_name

# Run migrations
npm run migrate:latest

# Rollback migration
npm run migrate:rollback

# Create seed
npm run seed:make seed_name

# Run seeds
npm run seed:run
```

### Frontend Development

```bash
cd client

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit
```

## Next Steps

1. **Read Documentation:**
   - `README.md` - Project overview
   - `FRONTEND-IMPLEMENTATION.md` - Frontend architecture
   - `DATABASE-DESIGN-SUMMARY.md` - Database schema
   - `frontend-architecture.md` - Detailed frontend design

2. **Explore the Code:**
   - Start with `src/server.js` (backend entry)
   - Then `client/src/App.tsx` (frontend entry)
   - Review `src/routes/` for API endpoints
   - Check `client/src/store/` for state management

3. **Try These Features:**
   - Create a game session
   - View tavern cards
   - Check player stats
   - Explore the UI components

4. **Development Workflow:**
   - Make changes to backend → see logs update
   - Make changes to frontend → see browser update
   - Add new components in `client/src/components/`
   - Add new API routes in `src/routes/`

## Useful Commands

```bash
# Backend
npm run dev              # Start dev server
npm run lint            # Run ESLint
npm run format          # Format code
npm test                # Run tests

# Frontend
cd client
npm run dev             # Start dev server
npm run build           # Build for production
npm run preview         # Preview build
npm run lint            # Run ESLint

# Database
npm run migrate:latest  # Apply migrations
npm run seed:run        # Seed database
npm run db:reset        # Reset database
```

## Support

For issues or questions:
1. Check logs in `logs/server.log`
2. Review browser console for frontend errors
3. Check database with SQLite browser
4. Review documentation files

## License

MIT
