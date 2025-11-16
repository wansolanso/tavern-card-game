const express = require('express');
const GameController = require('../controllers/GameController');
const { authenticate } = require('../middleware/auth');
const { gameCreationLimiter, combatLimiter, gameActionLimiter } = require('../middleware/rateLimiting');

const router = express.Router();

// All game routes require authentication
router.use(authenticate);

// Create new game (strict rate limiting)
router.post('/', gameCreationLimiter, GameController.createGame);

// List player games
router.get('/', GameController.listGames);

// Get game state
router.get('/:gameId', GameController.getGame);

// Equip card (moderate rate limiting)
router.post('/:gameId/equip', gameActionLimiter, GameController.equipCard);

// Unequip card (moderate rate limiting)
router.post('/:gameId/unequip', gameActionLimiter, GameController.unequipCard);

// Discard card (moderate rate limiting)
router.post('/:gameId/discard', gameActionLimiter, GameController.discardCard);

// Upgrade slot (moderate rate limiting)
router.post('/:gameId/upgrade-slot', gameActionLimiter, GameController.upgradeSlot);

// Attack tavern card (strict combat rate limiting)
router.post('/:gameId/attack', combatLimiter, GameController.attack);

module.exports = router;
