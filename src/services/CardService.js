const CardRepository = require('../repositories/CardRepository');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');
const { GAME_CONFIG, CARD_RARITY, CACHE_CONFIG } = require('../constants/game');
const { requirePositiveInteger, requireNonEmptyString, requireNonNegativeInteger } = require('../utils/validation');
const { ValidationError } = require('../utils/errors');

class CardService {
  async getAllCards() {
    try {
      const redis = await getRedisClient();
      const cacheKey = `${CACHE_CONFIG.CARDS_PREFIX}:all`;

      // Try to get from cache first (if Redis available)
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          logger.debug('Cards retrieved from cache');
          return JSON.parse(cached);
        }
      }

      // If not in cache, get from database
      const cards = await CardRepository.getAllCards();

      // Cache the result (if Redis available)
      if (redis) {
        await redis.setEx(cacheKey, GAME_CONFIG.CARD_CACHE_TTL, JSON.stringify(cards));
      }

      logger.info(`Retrieved ${cards.length} cards from database`);
      return cards;
    } catch (error) {
      logger.error('Error getting all cards:', error);
      throw error;
    }
  }

  async getCardById(id) {
    try {
      // Validate input
      requirePositiveInteger(id, 'id');

      const redis = await getRedisClient();
      const cacheKey = `${CACHE_CONFIG.CARDS_PREFIX}:${id}`;

      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const card = await CardRepository.findById(id);

      if (redis) {
        await redis.setEx(cacheKey, GAME_CONFIG.CARD_CACHE_TTL, JSON.stringify(card));
      }

      return card;
    } catch (error) {
      logger.error(`Error getting card ${id}:`, error);
      throw error;
    }
  }

  async getCardsByRarity(rarity) {
    try {
      // Validate input
      requireNonEmptyString(rarity, 'rarity');

      const redis = await getRedisClient();
      const cacheKey = `${CACHE_CONFIG.CARDS_PREFIX}:rarity:${rarity}`;

      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const cards = await CardRepository.getCardsByRarity(rarity);

      if (redis) {
        await redis.setEx(cacheKey, GAME_CONFIG.CARD_CACHE_TTL, JSON.stringify(cards));
      }

      return cards;
    } catch (error) {
      logger.error(`Error getting cards by rarity ${rarity}:`, error);
      throw error;
    }
  }

  async getRegularCards() {
    try {
      const redis = await getRedisClient();
      const cacheKey = `${CACHE_CONFIG.CARDS_PREFIX}:regular`;

      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const cards = await CardRepository.getRegularCards();

      if (redis) {
        await redis.setEx(cacheKey, GAME_CONFIG.CARD_CACHE_TTL, JSON.stringify(cards));
      }

      return cards;
    } catch (error) {
      logger.error('Error getting regular cards:', error);
      throw error;
    }
  }

  async getBossCards() {
    try {
      const redis = await getRedisClient();
      const cacheKey = `${CACHE_CONFIG.CARDS_PREFIX}:boss`;

      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const cards = await CardRepository.getBossCards();

      if (redis) {
        await redis.setEx(cacheKey, GAME_CONFIG.CARD_CACHE_TTL, JSON.stringify(cards));
      }

      return cards;
    } catch (error) {
      logger.error('Error getting boss cards:', error);
      throw error;
    }
  }

  async getRandomCards(count, excludeIds = []) {
    try {
      // Validate input
      requirePositiveInteger(count, 'count');

      // Validate excludeIds is an array if provided
      if (excludeIds !== undefined && excludeIds !== null && !Array.isArray(excludeIds)) {
        throw new ValidationError('excludeIds must be an array');
      }

      // Random cards should not be cached
      const cards = await CardRepository.getRandomCards(count, excludeIds);

      logger.info(`Generated ${cards.length} random cards`);
      return cards;
    } catch (error) {
      logger.error('Error getting random cards:', error);
      throw error;
    }
  }

  async warmCache() {
    try {
      logger.info('Warming card cache...');

      // Warm cache with all cards
      await this.getAllCards();
      await this.getRegularCards();
      await this.getBossCards();

      // Warm cache with cards by rarity
      const rarities = Object.values(CARD_RARITY);
      for (const rarity of rarities) {
        await this.getCardsByRarity(rarity);
      }

      logger.info('Card cache warmed successfully');
    } catch (error) {
      logger.error('Error warming card cache:', error);
      // Don't throw - cache warming is optional
    }
  }

  async clearCache() {
    try {
      const redis = await getRedisClient();

      if (redis) {
        const keys = await redis.keys(`${CACHE_CONFIG.CARDS_PREFIX}:*`);

        if (keys.length > 0) {
          await redis.del(keys);
          logger.info(`Cleared ${keys.length} card cache entries`);
        }
      }
    } catch (error) {
      logger.error('Error clearing card cache:', error);
      throw error;
    }
  }
}

module.exports = new CardService();
