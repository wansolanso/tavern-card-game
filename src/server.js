require('dotenv').config();
const http = require('http');
const app = require('./app');
const { createRedisClient, closeRedisClient } = require('./config/redis');
const { initializeWebSocket } = require('./websocket');
const CardService = require('./services/CardService');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Create HTTP server
const server = http.createServer(app);

// Initialize Redis and start server
async function startServer() {
  try {
    // Connect to Redis
    logger.info('Connecting to Redis...');
    await createRedisClient();

    // Initialize WebSocket
    logger.info('Initializing WebSocket server...');
    initializeWebSocket(server);

    // Warm card cache
    logger.info('Warming card cache...');
    await CardService.warmCache();

    // Start server
    server.listen(PORT, HOST, () => {
      logger.info(`Server running on http://${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`API available at http://${HOST}:${PORT}/api/v1`);
      logger.info(`WebSocket available at ws://${HOST}:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down server...');

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await closeRedisClient();
      logger.info('Redis connection closed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});

// Start the server
startServer();

module.exports = server;
