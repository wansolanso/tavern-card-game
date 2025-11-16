const CardService = require('../services/CardService');
const logger = require('../utils/logger');

class CardController {
  async getAllCards(req, res, next) {
    try {
      const cards = await CardService.getAllCards();

      res.status(200).json({
        status: 'success',
        data: { cards }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCard(req, res, next) {
    try {
      const { cardId } = req.params;

      const card = await CardService.getCardById(cardId);

      res.status(200).json({
        status: 'success',
        data: { card }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CardController();
