const redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

async function createRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  // Check if Redis should be optional (for development)
  const redisOptional = process.env.REDIS_OPTIONAL === 'true' || process.env.NODE_ENV === 'development';

  // Skip Redis entirely if optional and no URL configured
  if (redisOptional && !process.env.REDIS_URL) {
    logger.info('Redis disabled (REDIS_OPTIONAL=true, no URL configured)');
    redisClient = null;
    return null;
  }

  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 0 && redisOptional) {
            // Don't retry if Redis is optional
            return false;
          }
          if (retries > 3) {
            logger.warn('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 1000);
        }
      }
    });

    redisClient.on('error', (err) => {
      if (redisOptional) {
        logger.debug('Redis Client Error (optional mode):', err.message);
      } else {
        logger.error('Redis Client Error:', err);
      }
    });

    redisClient.on('connect', () => {
      logger.info('Redis: Connected successfully');
    });

    redisClient.on('reconnecting', () => {
      if (!redisOptional) {
        logger.warn('Redis: Reconnecting...');
      }
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    if (redisOptional) {
      logger.info('Redis not available, running without cache');
      redisClient = null;
      return null;
    }
    logger.error('Failed to create Redis client:', error);
    throw error;
  }
}

async function getRedisClient() {
  if (!redisClient) {
    return await createRedisClient();
  }
  // In Redis v5, use readyStatus to check connection state
  if (redisClient.status && redisClient.status !== 'ready') {
    return null;
  }
  return redisClient;
}

async function closeRedisClient() {
  if (redisClient && (redisClient.status === 'ready' || redisClient.status === 'connecting')) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis: Connection closed');
  }
}

module.exports = {
  createRedisClient,
  getRedisClient,
  closeRedisClient
};
