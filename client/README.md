# Tavern Card Game - Frontend

A modern React frontend for the Tavern Card Game - a roguelike card battler built with React 18, TypeScript, TailwindCSS, and Framer Motion.

## Tech Stack

- **React 18+** - UI library with modern hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **Framer Motion** - Animation library
- **Socket.io Client** - Real-time WebSocket communication
- **Axios** - HTTP client for API calls

## Project Structure

```
client/
├── src/
│   ├── components/          # React components
│   │   ├── Board/          # Game board components
│   │   ├── Cards/          # Card components
│   │   ├── Combat/         # Combat-related components
│   │   ├── Equipment/      # Equipment slot components
│   │   ├── Layout/         # Layout components (header, footer)
│   │   ├── Animations/     # Animation components
│   │   └── UI/             # Reusable UI components
│   │
│   ├── store/              # Zustand state management
│   │   ├── slices/        # State slices (player, game, combat, ui)
│   │   └── index.ts       # Store configuration
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useSocket.ts           # WebSocket hook
│   │   ├── useSocketHandlers.ts   # WebSocket event handlers
│   │   └── useGameActions.ts      # Game action emitters
│   │
│   ├── providers/          # React context providers
│   │   └── SocketProvider.tsx     # WebSocket context
│   │
│   ├── types/              # TypeScript type definitions
│   │   ├── card.ts        # Card-related types
│   │   ├── state.ts       # State types
│   │   ├── websocket.ts   # WebSocket event types
│   │   └── components.ts  # Component prop types
│   │
│   ├── animations/         # Animation configurations
│   │   └── config.ts      # Framer Motion variants
│   │
│   ├── config/            # App configuration
│   │   └── constants.ts   # API endpoints, constants
│   │
│   ├── utils/             # Utility functions
│   │
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles
│
├── public/                # Static assets
├── .env.development       # Development environment variables
├── .env.example          # Environment variables template
├── tailwind.config.js    # TailwindCSS configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── package.json          # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.development
```

4. Update `.env.development` with your backend API URL:
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Architecture

### State Management (Zustand)

The application uses Zustand with a modular slice pattern for state management:

- **Player Slice**: Player stats, equipped cards, hand, abilities
- **Game Slice**: Game state, tavern cards, boss data, settings
- **Combat Slice**: Combat log, animations, damage queue
- **UI Slice**: Modal states, notifications, tooltips, loading states

### WebSocket Integration

Real-time communication with the backend uses Socket.io:

1. **SocketProvider** - Manages WebSocket connection
2. **useSocketHandlers** - Listens to server events and updates store
3. **useGameActions** - Emits client actions to server

### Component Architecture

Components are organized by feature and follow atomic design principles:

- **UI Components**: Reusable, generic components (Button, Modal, ProgressBar)
- **Feature Components**: Game-specific components (Card, GameBoard, PlayerStats)
- **Layout Components**: Page structure (GameHeader, Footer)

### Routing & Navigation

The app uses phase-based routing controlled by the Zustand store:

- `lobby` - Main menu
- `tavern` - Main game board
- `boss` - Boss fight screen
- `gameover` - Game over screen

## Features

### Implemented

- Guest authentication
- Game session creation
- WebSocket connection
- State management with Zustand
- Responsive UI with TailwindCSS
- Notification system
- Modal system
- Loading states
- Basic game board layout

### In Development

- Drag-and-drop card system
- Combat animations
- Equipment system
- Boss fight mechanics
- Card collection screen
- Sound effects and music

### Planned

- Persistent game saves
- Leaderboards
- Achievements
- Card unlocks
- Custom game modes

## API Integration

The frontend communicates with the backend via:

1. **REST API** - For game actions (equip, attack, discard)
2. **WebSocket** - For real-time updates (game state, combat events)

### API Endpoints

- `POST /api/v1/auth/guest` - Create guest session
- `POST /api/v1/games` - Create new game
- `GET /api/v1/games` - List player's games
- `GET /api/v1/games/:id` - Get game state
- `POST /api/v1/games/:id/equip` - Equip card
- `POST /api/v1/games/:id/attack` - Attack tavern card
- `GET /api/v1/cards` - Get card catalog

### WebSocket Events

**Client → Server:**
- `action:attack:tavern` - Attack a tavern card
- `action:equip` - Equip a card to slot
- `action:discard` - Discard a card
- `action:upgrade` - Upgrade a slot
- `action:ability` - Use an ability

**Server → Client:**
- `game:state:update` - Game state changed
- `tavern:update` - Tavern cards updated
- `combat:damage` - Damage dealt
- `boss:spawned` - Boss appeared
- `game:over` - Game ended

## Styling

The app uses TailwindCSS with a custom theme:

### Custom Colors

- `tavern-dark` - Dark brown background
- `tavern-wood` - Wood texture brown
- `tavern-gold` - Gold accent color
- `tavern-bronze` - Bronze accent
- `card-common/uncommon/rare/epic/legendary` - Card rarity colors

### Custom Animations

- `attack` - Attack animation
- `damage` - Damage number float
- `shake` - Shake effect
- `float` - Floating animation
- `glow` - Glow effect for legendary cards

## Performance Optimizations

- Component memoization with `React.memo`
- Selective re-renders with Zustand selectors
- Code splitting for routes
- Lazy loading for images
- Debounced user inputs
- Optimistic UI updates

## Accessibility

The app follows WCAG 2.1 AA guidelines:

- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support
- Color contrast compliance

## Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT
