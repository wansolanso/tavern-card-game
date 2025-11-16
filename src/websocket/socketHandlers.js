const AuthService = require('../services/AuthService');
const GameService = require('../services/GameService');
const CombatService = require('../services/CombatService');
const logger = require('../utils/logger');

async function handleConnection(io, socket) {
  logger.info(`Client connected: ${socket.id}`);

  // Authenticate socket connection
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data;
      const session = await AuthService.validateToken(token);

      socket.userId = session.playerId;
      socket.authenticated = true;

      socket.emit('authenticated', {
        playerId: session.playerId,
        guestId: session.guestId
      });

      logger.info(`Socket ${socket.id} authenticated for player ${session.playerId}`);
    } catch (error) {
      logger.error('Socket authentication error:', error);
      socket.emit('auth_error', {
        message: 'Authentication failed'
      });
      socket.disconnect();
    }
  });

  // Join game room
  socket.on('join_game', async (data) => {
    try {
      if (!socket.authenticated) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { gameId } = data;
      const game = await GameService.getGame(gameId);

      socket.join(`game:${gameId}`);
      socket.currentGame = gameId;

      socket.emit('game_joined', { gameId, game });

      logger.info(`Player ${socket.userId} joined game ${gameId}`);
    } catch (error) {
      logger.error('Error joining game:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  // Leave game room
  socket.on('leave_game', async (data) => {
    try {
      const { gameId } = data;

      socket.leave(`game:${gameId}`);
      socket.currentGame = null;

      socket.emit('game_left', { gameId });

      logger.info(`Player ${socket.userId} left game ${gameId}`);
    } catch (error) {
      logger.error('Error leaving game:', error);
    }
  });

  // Equip card
  socket.on('equip_card', async (data) => {
    try {
      if (!socket.authenticated) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { gameId, cardId, slot } = data;

      const game = await GameService.equipCard(gameId, cardId, slot);

      // Broadcast to all clients in game room
      io.to(`game:${gameId}`).emit('game_updated', { game });

      logger.info(`Card ${cardId} equipped in game ${gameId}`);
    } catch (error) {
      logger.error('Error equipping card:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Unequip card
  socket.on('unequip_card', async (data) => {
    try {
      if (!socket.authenticated) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { gameId, cardId } = data;

      const game = await GameService.unequipCard(gameId, cardId);

      io.to(`game:${gameId}`).emit('game_updated', { game });

      logger.info(`Card ${cardId} unequipped in game ${gameId}`);
    } catch (error) {
      logger.error('Error unequipping card:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Attack tavern card
  socket.on('attack', async (data) => {
    try {
      if (!socket.authenticated) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { gameId, targetCardId } = data;

      const result = await CombatService.attackTavernCard(gameId, targetCardId);

      // Broadcast combat result
      io.to(`game:${gameId}`).emit('combat_result', {
        game: result.game,
        combatLog: result.combatLog,
        targetDestroyed: result.targetDestroyed
      });

      logger.info(`Combat completed in game ${gameId}`);
    } catch (error) {
      logger.error('Error in combat:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Discard card
  socket.on('discard_card', async (data) => {
    try {
      if (!socket.authenticated) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { gameId, cardId } = data;

      const game = await GameService.discardCard(gameId, cardId);

      io.to(`game:${gameId}`).emit('game_updated', { game });

      logger.info(`Card ${cardId} discarded in game ${gameId}`);
    } catch (error) {
      logger.error('Error discarding card:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Upgrade slot
  socket.on('upgrade_slot', async (data) => {
    try {
      if (!socket.authenticated) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { gameId, slotType } = data;

      const game = await GameService.upgradeSlot(gameId, slotType);

      io.to(`game:${gameId}`).emit('game_updated', { game });

      logger.info(`Slot ${slotType} upgraded in game ${gameId}`);
    } catch (error) {
      logger.error('Error upgrading slot:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);

    if (socket.currentGame) {
      socket.leave(`game:${socket.currentGame}`);
    }
  });
}

module.exports = { handleConnection };
