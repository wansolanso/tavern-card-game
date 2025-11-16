const express = require('express');
const CardController = require('../controllers/CardController');

const router = express.Router();

// Card catalog is public (no authentication required)

// Get all cards
router.get('/', CardController.getAllCards);

// Get specific card
router.get('/:cardId', CardController.getCard);

module.exports = router;
