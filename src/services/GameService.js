const GameRepository = require('../repositories/GameRepository');
const CardService = require('./CardService');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');
const { NotFoundError, ConflictError } = require('../utils/errors');
const { createEnhancedError } = require('../utils/errorResponse');
const {
  VALID_SLOTS,
  VALID_PHASES,
  GAME_CONFIG,
  validation
} = require('../constants/game');
const { requirePositiveInteger, requireNonNegativeInteger } = require('../utils/validation');

class GameService {
  async createGame(playerId) {
    try {
      // Validate input
      requirePositiveInteger(playerId, 'playerId');

      // Create new game
      const game = await GameRepository.create(playerId);

      // Initialize tavern with random cards
      const tavernCards = await CardService.getRandomCards(GAME_CONFIG.TAVERN_SIZE);

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

      // Initialize player's starting hand with random cards
      const startingHandCards = await CardService.getRandomCards(GAME_CONFIG.STARTING_HAND_SIZE);

      for (const card of startingHandCards) {
        await GameRepository.addCardToHand(game.id, card.id);
      }

      // Update game with starting HP
      await GameRepository.update(game.id, {
        player_current_hp: GAME_CONFIG.STARTING_HP,
        player_max_hp: GAME_CONFIG.STARTING_MAX_HP
      });

      // Load full game state
      const fullGame = await GameRepository.findById(game.id);

      // Cache game state
      await this.cacheGameState(fullGame);

      logger.info(`Game ${game.id} created for player ${playerId} with ${GAME_CONFIG.STARTING_HAND_SIZE} starting cards`);

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
      // Validate input
      requirePositiveInteger(gameId, 'gameId');
      requirePositiveInteger(cardId, 'cardId');

      // Validate slot type
      if (!validation.isValidSlot(slot)) {
        throw createEnhancedError('CARD_INVALID_SLOT', { slot, validSlots: VALID_SLOTS });
      }

      await GameRepository.equipCard(gameId, cardId, slot);

      // Clear cache
      await this.clearGameCache(gameId);

      // Get updated game state
      const game = await this.getGame(gameId);

      // Recalculate player_max_hp if HP card was equipped
      if (slot === 'hp' && game.equipped.hp && game.equipped.hp.length > 0) {
        // HP is ONLY from equipped cards, not base + cards
        const totalHp = game.equipped.hp.reduce((sum, card) => {
          return sum + (card.stats?.hp || 0);
        }, 0);

        const newMaxHp = totalHp;

        // Update max HP and heal player to full
        await GameRepository.update(gameId, {
          player_max_hp: newMaxHp,
          player_current_hp: newMaxHp
        });

        // Clear cache again and reload game state
        await this.clearGameCache(gameId);
        const updatedGame = await this.getGame(gameId);

        logger.info(`Card ${cardId} equipped in slot ${slot} for game ${gameId} - Max HP updated to ${newMaxHp}`);

        return updatedGame;
      }

      logger.info(`Card ${cardId} equipped in slot ${slot} for game ${gameId}`);

      return game;
    } catch (error) {
      // Map ConflictError for slot full
      if (error instanceof ConflictError && error.message.includes('full')) {
        throw createEnhancedError('CARD_SLOT_FULL', { slot });
      }
      logger.error(`Error equipping card:`, error);
      throw error;
    }
  }

  async unequipCard(gameId, cardId) {
    try {
      // Validate input
      requirePositiveInteger(gameId, 'gameId');
      requirePositiveInteger(cardId, 'cardId');

      // Get game state before unequipping to check if it's an HP card
      const gameBefore = await this.getGame(gameId);
      const wasHpCard = gameBefore.equipped.hp?.some(card => card.id === cardId);

      await GameRepository.unequipCard(gameId, cardId);

      // Clear cache
      await this.clearGameCache(gameId);

      // Get updated game state
      const game = await this.getGame(gameId);

      // Recalculate player_max_hp if HP card was unequipped
      if (wasHpCard) {
        // HP is ONLY from equipped cards, no base HP
        const totalHp = (game.equipped.hp || []).reduce((sum, card) => {
          return sum + (card.stats?.hp || 0);
        }, 0);

        const newMaxHp = totalHp; // If 0 cards equipped, maxHP = 0

        // Update max HP and clamp current HP to new max
        const newCurrentHp = Math.min(game.player_current_hp, newMaxHp);

        await GameRepository.update(gameId, {
          player_max_hp: newMaxHp,
          player_current_hp: newCurrentHp
        });

        // Clear cache again and reload game state
        await this.clearGameCache(gameId);
        const updatedGame = await this.getGame(gameId);

        logger.info(`Card ${cardId} unequipped for game ${gameId} - Max HP updated to ${newMaxHp}`);

        return updatedGame;
      }

      logger.info(`Card ${cardId} unequipped for game ${gameId}`);

      return game;
    } catch (error) {
      logger.error(`Error unequipping card:`, error);
      throw error;
    }
  }

  async discardCard(gameId, cardId) {
    try {
      // Validate input
      requirePositiveInteger(gameId, 'gameId');
      requirePositiveInteger(cardId, 'cardId');

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
      // Validate input
      requirePositiveInteger(gameId, 'gameId');

      if (!validation.isValidSlot(slotType)) {
        throw createEnhancedError('CARD_INVALID_SLOT', { slot: slotType, validSlots: VALID_SLOTS });
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
      // Validate input
      requirePositiveInteger(gameId, 'gameId');

      const game = await this.getGame(gameId);

      // Get current tavern cards
      const currentTavernCardIds = game.tavern.map(c => c.id);
      const occupiedPositions = game.tavern.map(c => c.position);

      // Find empty positions
      const allPositions = Array.from({ length: GAME_CONFIG.TAVERN_SIZE }, (_, i) => i);
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

        logger.info(`Tavern replenished with ${emptyPositions.length} new cards for game ${gameId}`);
      }

      return await this.getGame(gameId);
    } catch (error) {
      logger.error(`Error replenishing tavern:`, error);
      throw error;
    }
  }

  async updateGamePhase(gameId, phase) {
    try {
      // Validate input
      requirePositiveInteger(gameId, 'gameId');

      if (!validation.isValidPhase(phase)) {
        throw createEnhancedError('GAME_INVALID_PHASE', { phase, validPhases: VALID_PHASES });
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
      // Validate input
      requirePositiveInteger(gameId, 'gameId');

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
      // Validate input
      requirePositiveInteger(gameId, 'gameId');
      requireNonNegativeInteger(hp, 'hp');

      // Clamp HP to valid range (0 to max)
      const game = await this.getGame(gameId);
      hp = validation.clampHP(hp, game.player_max_hp);

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
        await redis.setEx(cacheKey, GAME_CONFIG.GAME_CACHE_TTL, JSON.stringify(game));
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
