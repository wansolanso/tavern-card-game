const GameRepository = require('../repositories/GameRepository');
const CardService = require('./CardService');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');
const { NotFoundError, ConflictError } = require('../utils/errors');

const GAME_CACHE_TTL = 60 * 5; // 5 minutes
const TAVERN_SIZE = 9;
const STARTING_HP = 100;

class GameService {
  async createGame(playerId) {
    try {
      // Create new game
      const game = await GameRepository.create(playerId);

      // Initialize tavern with 9 random cards
      const tavernCards = await CardService.getRandomCards(TAVERN_SIZE);

      for (let i = 0; i < tavernCards.length; i++) {
        const card = tavernCards[i];
        await GameRepository.addTavernCard(
          game.id,
          card.id,
          card.hp,
          card.shield,
          i
        );
      }

      // Update game with starting HP
      await GameRepository.update(game.id, {
        player_current_hp: STARTING_HP,
        player_max_hp: STARTING_HP
      });

      // Load full game state
      const fullGame = await GameRepository.findById(game.id);

      // Cache game state
      await this.cacheGameState(fullGame);

      logger.info(`Game ${game.id} created for player ${playerId}`);

      return fullGame;
    } catch (error) {
      logger.error('Error creating game:', error);
      throw error;
    }
  }

  async getGame(gameId) {
    try {
      // Try cache first (if Redis available)
      const redis = await getRedisClient();
      const cacheKey = `game:${gameId}`;

      if (redis) {
        const cached = await redis.get(cacheKey);

        if (cached) {
          logger.debug(`Game ${gameId} retrieved from cache`);
          return JSON.parse(cached);
        }
      }

      // Get from database
      const game = await GameRepository.findById(gameId);

      // Cache the result
      await this.cacheGameState(game);

      return game;
    } catch (error) {
      logger.error(`Error getting game ${gameId}:`, error);
      throw error;
    }
  }

  async getPlayerGames(playerId) {
    try {
      const games = await GameRepository.findByPlayerId(playerId);
      return games;
    } catch (error) {
      logger.error(`Error getting games for player ${playerId}:`, error);
      throw error;
    }
  }

  async equipCard(gameId, cardId, slot) {
    try {
      // Validate slot type
      const validSlots = ['hp', 'shield', 'special', 'passive', 'normal'];
      if (!validSlots.includes(slot)) {
        throw new ConflictError(`Invalid slot type: ${slot}`);
      }

      await GameRepository.equipCard(gameId, cardId, slot);

      // Clear cache
      await this.clearGameCache(gameId);

      // Return updated game state
      const game = await this.getGame(gameId);

      logger.info(`Card ${cardId} equipped in slot ${slot} for game ${gameId}`);

      return game;
    } catch (error) {
      logger.error(`Error equipping card:`, error);
      throw error;
    }
  }

  async unequipCard(gameId, cardId) {
    try {
      await GameRepository.unequipCard(gameId, cardId);

      // Clear cache
      await this.clearGameCache(gameId);

      const game = await this.getGame(gameId);

      logger.info(`Card ${cardId} unequipped for game ${gameId}`);

      return game;
    } catch (error) {
      logger.error(`Error unequipping card:`, error);
      throw error;
    }
  }

  async discardCard(gameId, cardId) {
    try {
      await GameRepository.discardCard(gameId, cardId);

      // Clear cache
      await this.clearGameCache(gameId);

      const game = await this.getGame(gameId);

      logger.info(`Card ${cardId} discarded for game ${gameId}`);

      return game;
    } catch (error) {
      logger.error(`Error discarding card:`, error);
      throw error;
    }
  }

  async upgradeSlot(gameId, slotType) {
    try {
      const validSlots = ['hp', 'shield', 'special', 'passive', 'normal'];
      if (!validSlots.includes(slotType)) {
        throw new ConflictError(`Invalid slot type: ${slotType}`);
      }

      await GameRepository.upgradeSlot(gameId, slotType);

      // Clear cache
      await this.clearGameCache(gameId);

      const game = await this.getGame(gameId);

      logger.info(`Slot ${slotType} upgraded for game ${gameId}`);

      return game;
    } catch (error) {
      logger.error(`Error upgrading slot:`, error);
      throw error;
    }
  }

  async replenishTavern(gameId) {
    try {
      const game = await this.getGame(gameId);

      // Get current tavern cards
      const currentTavernCardIds = game.tavern.map(c => c.id);
      const occupiedPositions = game.tavern.map(c => c.position);

      // Find empty positions
      const allPositions = Array.from({ length: TAVERN_SIZE }, (_, i) => i);
      const emptyPositions = allPositions.filter(pos => !occupiedPositions.includes(pos));

      if (emptyPositions.length > 0) {
        // Get random cards that are not in tavern or player hand
        const handCardIds = game.hand.map(c => c.id);
        const excludeIds = [...currentTavernCardIds, ...handCardIds];

        const newCards = await CardService.getRandomCards(emptyPositions.length, excludeIds);

        // Add new cards to tavern at empty positions
        for (let i = 0; i < newCards.length; i++) {
          const card = newCards[i];
          await GameRepository.addTavernCard(
            gameId,
            card.id,
            card.hp,
            card.shield,
            emptyPositions[i]
          );
        }

        // Clear cache
        await this.clearGameCache(gameId);

        logger.info(`Tavern replenished with ${emptySlots} new cards for game ${gameId}`);
      }

      return await this.getGame(gameId);
    } catch (error) {
      logger.error(`Error replenishing tavern:`, error);
      throw error;
    }
  }

  async updateGamePhase(gameId, phase) {
    try {
      const validPhases = ['tavern', 'combat', 'management', 'victory', 'defeat'];
      if (!validPhases.includes(phase)) {
        throw new ConflictError(`Invalid phase: ${phase}`);
      }

      await GameRepository.update(gameId, { phase });

      // Clear cache
      await this.clearGameCache(gameId);

      const game = await this.getGame(gameId);

      logger.info(`Game ${gameId} phase updated to ${phase}`);

      return game;
    } catch (error) {
      logger.error(`Error updating game phase:`, error);
      throw error;
    }
  }

  async advanceTurn(gameId) {
    try {
      const game = await this.getGame(gameId);

      await GameRepository.update(gameId, {
        current_turn: game.current_turn + 1
      });

      // Clear cache
      await this.clearGameCache(gameId);

      const updatedGame = await this.getGame(gameId);

      logger.info(`Game ${gameId} advanced to turn ${updatedGame.current_turn}`);

      return updatedGame;
    } catch (error) {
      logger.error(`Error advancing turn:`, error);
      throw error;
    }
  }

  async updatePlayerHP(gameId, hp) {
    try {
      if (hp < 0) {
        hp = 0;
      }

      await GameRepository.update(gameId, {
        player_current_hp: hp
      });

      // Clear cache
      await this.clearGameCache(gameId);

      // Check for defeat
      if (hp <= 0) {
        await this.updateGamePhase(gameId, 'defeat');
      }

      return await this.getGame(gameId);
    } catch (error) {
      logger.error(`Error updating player HP:`, error);
      throw error;
    }
  }

  async cacheGameState(game) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const cacheKey = `game:${game.id}`;
        await redis.setEx(cacheKey, GAME_CACHE_TTL, JSON.stringify(game));
      }
    } catch (error) {
      // Log but don't throw - caching is optional
      logger.warn(`Failed to cache game state:`, error);
    }
  }

  async clearGameCache(gameId) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const cacheKey = `game:${gameId}`;
        await redis.del(cacheKey);
      }
    } catch (error) {
      logger.warn(`Failed to clear game cache:`, error);
    }
  }
}

module.exports = new GameService();
