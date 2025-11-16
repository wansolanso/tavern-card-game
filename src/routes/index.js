const express = require('express');
const authRoutes = require('./authRoutes');
const gameRoutes = require('./gameRoutes');
const cardRoutes = require('./cardRoutes');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Tavern Card Game API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/games', gameRoutes);
router.use('/cards', cardRoutes);

module.exports = router;
