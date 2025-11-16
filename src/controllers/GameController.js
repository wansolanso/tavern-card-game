const GameService = require('../services/GameService');
const CombatService = require('../services/CombatService');
const logger = require('../utils/logger');

class GameController {
  async createGame(req, res, next) {
    try {
      const game = await GameService.createGame(req.playerId);

      res.status(201).json({
        status: 'success',
        data: { game }
      });
    } catch (error) {
      next(error);
    }
  }

  async listGames(req, res, next) {
    try {
      const games = await GameService.getPlayerGames(req.playerId);

      res.status(200).json({
        status: 'success',
        data: games
      });
    } catch (error) {
      next(error);
    }
  }

  async getGame(req, res, next) {
    try {
      const { gameId } = req.params;

      const game = await GameService.getGame(gameId);

      res.status(200).json({
        status: 'success',
        data: { game }
      });
    } catch (error) {
      next(error);
    }
  }

  async equipCard(req, res, next) {
    try {
      const { gameId } = req.params;
      const { cardId, slot } = req.body;

      const game = await GameService.equipCard(gameId, cardId, slot);

      res.status(200).json({
        status: 'success',
        data: { game }
      });
    } catch (error) {
      next(error);
    }
  }

  async unequipCard(req, res, next) {
    try {
      const { gameId } = req.params;
      const { cardId } = req.body;

      const game = await GameService.unequipCard(gameId, cardId);

      res.status(200).json({
        status: 'success',
        data: { game }
      });
    } catch (error) {
      next(error);
    }
  }

  async discardCard(req, res, next) {
    try {
      const { gameId } = req.params;
      const { cardId } = req.body;

      const game = await GameService.discardCard(gameId, cardId);

      res.status(200).json({
        status: 'success',
        data: { game }
      });
    } catch (error) {
      next(error);
    }
  }

  async upgradeSlot(req, res, next) {
    try {
      const { gameId } = req.params;
      const { slotType } = req.body;

      const game = await GameService.upgradeSlot(gameId, slotType);

      res.status(200).json({
        status: 'success',
        data: { game }
      });
    } catch (error) {
      next(error);
    }
  }

  async attack(req, res, next) {
    try {
      const { gameId } = req.params;
      const { targetCardId } = req.body;

      const result = await CombatService.attackTavernCard(gameId, targetCardId);

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GameController();
