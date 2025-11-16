# Tavern Card Game - Changelog de Implementação

## Backend Implementado (2025-11-15)

### Estrutura do Projeto
- `src/` - Código fonte principal
  - `config/` - Configurações (database, Redis, JWT)
  - `services/` - Lógica de negócio
  - `repositories/` - Acesso a dados
  - `controllers/` - Controladores REST
  - `routes/` - Rotas da API
  - `middleware/` - Auth, validação, error handling
  - `websocket/` - Socket.io handlers
  - `utils/` - Logger, errors

### Database
- SQLite (dev) com migrations rodadas
- 11 tabelas criadas e populadas
- 40 cartas + 35 habilidades seeded
- Suporte a PostgreSQL (prod) preparado

### Serviços Core
- **AuthService** - JWT + sessões guest (24h expiration)
- **CardService** - Catálogo de cartas com cache Redis opcional
- **GameService** - Gerenciamento de partidas (criar, equipar, descartar)
- **CombatService** - Sistema de combate turn-based

### API REST
- `POST /api/v1/auth/guest` - Criar sessão
- `POST /api/v1/games` - Criar jogo
- `GET /api/v1/games/:id` - Estado do jogo
- `POST /api/v1/games/:id/equip` - Equipar carta
- `POST /api/v1/games/:id/attack` - Atacar
- `GET /api/v1/cards` - Listar cartas

### WebSocket (Socket.io)
- Eventos: `authenticate`, `join_game`, `equip_card`, `attack`, `discard_card`
- Broadcast de estado do jogo em tempo real
- Logs de combate detalhados

### Características
- Redis opcional (funciona sem cache)
- Logs estruturados (Winston)
- Error handling centralizado
- Validação com Zod
- CORS configurado
- Foreign keys habilitadas (SQLite)

## Pendente
- Frontend React + Vite + TailwindCSS
- Zustand state management
- Integração WebSocket no frontend
- UI do jogo (taverna, slots, combate)
- Sistema de boss fight
- Deploy (Vercel + Railway)

## Como Rodar
```bash
npm install
npm run migrate:latest
npm run seed:run
npm start
```

Servidor em: http://localhost:3000
API: http://localhost:3000/api/v1
WebSocket: ws://localhost:3000

## Decisões Técnicas
- Redis opcional para permitir dev sem dependências extras
- SQLite para dev rápido, PostgreSQL para prod
- Migrations compatíveis com ambos (increments vs uuid)
- Cache write-through para game state
- JWT stateless com fallback para database
