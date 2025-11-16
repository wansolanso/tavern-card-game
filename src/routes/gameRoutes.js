const express = require('express');
const GameController = require('../controllers/GameController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All game routes require authentication
router.use(authenticate);

// Create new game
router.post('/', GameController.createGame);

// List player games
router.get('/', GameController.listGames);

// Get game state
router.get('/:gameId', GameController.getGame);

// Equip card
router.post('/:gameId/equip', GameController.equipCard);

// Unequip card
router.post('/:gameId/unequip', GameController.unequipCard);

// Discard card
router.post('/:gameId/discard', GameController.discardCard);

// Upgrade slot
router.post('/:gameId/upgrade-slot', GameController.upgradeSlot);

// Attack tavern card
router.post('/:gameId/attack', GameController.attack);

module.exports = router;
