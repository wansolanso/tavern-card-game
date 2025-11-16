const { Server } = require('socket.io');
const { handleConnection } = require('./socketHandlers');
const logger = require('../utils/logger');

function initializeWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    handleConnection(io, socket);
  });

  logger.info('WebSocket server initialized');

  return io;
}

module.exports = { initializeWebSocket };
