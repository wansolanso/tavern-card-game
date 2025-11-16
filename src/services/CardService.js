const CardRepository = require('../repositories/CardRepository');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

const CACHE_TTL = 60 * 60; // 1 hour in seconds
const CACHE_KEY_PREFIX = 'cards';

class CardService {
  async getAllCards() {
    try {
      const redis = await getRedisClient();
      const cacheKey = `${CACHE_KEY_PREFIX}:all`;

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
        await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(cards));
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
      const redis = await getRedisClient();
      const cacheKey = `${CACHE_KEY_PREFIX}:${id}`;

      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const card = await CardRepository.findById(id);

      if (redis) {
        await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(card));
      }

      return card;
    } catch (error) {
      logger.error(`Error getting card ${id}:`, error);
      throw error;
    }
  }

  async getCardsByRarity(rarity) {
    try {
      const redis = await getRedisClient();
      const cacheKey = `${CACHE_KEY_PREFIX}:rarity:${rarity}`;

      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const cards = await CardRepository.getCardsByRarity(rarity);

      if (redis) {
        await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(cards));
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
      const cacheKey = `${CACHE_KEY_PREFIX}:regular`;

      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const cards = await CardRepository.getRegularCards();

      if (redis) {
        await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(cards));
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
      const cacheKey = `${CACHE_KEY_PREFIX}:boss`;

      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const cards = await CardRepository.getBossCards();

      if (redis) {
        await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(cards));
      }

      return cards;
    } catch (error) {
      logger.error('Error getting boss cards:', error);
      throw error;
    }
  }

  async getRandomCards(count, excludeIds = []) {
    try {
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
      const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
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
        const keys = await redis.keys(`${CACHE_KEY_PREFIX}:*`);

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
