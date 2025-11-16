const GameService = require('../GameService');
const GameRepository = require('../../repositories/GameRepository');
const CardService = require('../CardService');
const { GAME_CONFIG } = require('../../constants/game');

jest.mock('../../repositories/GameRepository');
jest.mock('../CardService');

describe('GameService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGame', () => {
    it('should create game with 9 tavern cards', async () => {
      const playerId = 123;
      const mockGame = {
        id: 456,
        player_id: playerId,
        phase: 'lobby',
        current_turn: 1,
      };

      const mockCards = Array(9)
        .fill(0)
        .map((_, i) => ({
          id: i + 1,
          name: `Card ${i + 1}`,
          hp: 10,
          shield: 5,
        }));

      GameRepository.create.mockResolvedValue(mockGame);
      CardService.getRandomCards.mockResolvedValue(mockCards);
      GameRepository.addTavernCard.mockResolvedValue();
      GameRepository.update.mockResolvedValue();
      GameRepository.findById.mockResolvedValue({
        ...mockGame,
        tavern: mockCards,
        hand: [],
        equipped: { hp: [], shield: [], special: [] },
        player_current_hp: GAME_CONFIG.STARTING_HP,
        player_max_hp: GAME_CONFIG.STARTING_MAX_HP,
      });

      const result = await GameService.createGame(playerId);

      expect(result).toHaveProperty('id');
      expect(result.tavern).toHaveLength(9);
      expect(GameRepository.create).toHaveBeenCalledWith(playerId);
      expect(CardService.getRandomCards).toHaveBeenCalledWith(GAME_CONFIG.TAVERN_SIZE);
      expect(GameRepository.addTavernCard).toHaveBeenCalledTimes(9);
      expect(GameRepository.update).toHaveBeenCalledWith(
        mockGame.id,
        expect.objectContaining({
          player_current_hp: GAME_CONFIG.STARTING_HP,
          player_max_hp: GAME_CONFIG.STARTING_MAX_HP,
        })
      );
    });

    it('should throw ValidationError if playerId is invalid', async () => {
      await expect(GameService.createGame(null)).rejects.toThrow();
      await expect(GameService.createGame(undefined)).rejects.toThrow();
      await expect(GameService.createGame('')).rejects.toThrow();
      await expect(GameService.createGame(0)).rejects.toThrow();
      await expect(GameService.createGame(-5)).rejects.toThrow();
    });

    it('should handle card service errors', async () => {
      const playerId = 123;
      const mockGame = { id: 456, player_id: playerId };

      GameRepository.create.mockResolvedValue(mockGame);
      CardService.getRandomCards.mockRejectedValue(new Error('No cards available'));

      await expect(GameService.createGame(playerId)).rejects.toThrow(
        'No cards available'
      );
    });
  });

  describe('getGame', () => {
    it('should retrieve game from database', async () => {
      const gameId = 123;
      const mockGame = global.testUtils.createMockGame({ id: gameId });

      GameRepository.findById.mockResolvedValue(mockGame);

      const result = await GameService.getGame(gameId);

      expect(result).toEqual(mockGame);
      expect(GameRepository.findById).toHaveBeenCalledWith(gameId);
    });

    it('should throw error if game not found', async () => {
      const gameId = 999;
      GameRepository.findById.mockRejectedValue(new Error('Game not found'));

      await expect(GameService.getGame(gameId)).rejects.toThrow('Game not found');
    });
  });

  describe('equipCard', () => {
    it('should equip card to valid slot', async () => {
      const gameId = 1;
      const cardId = 10;
      const slot = 'hp';
      const mockGame = global.testUtils.createMockGame({ id: gameId });

      GameRepository.equipCard.mockResolvedValue();
      GameRepository.findById.mockResolvedValue(mockGame);

      const result = await GameService.equipCard(gameId, cardId, slot);

      expect(result).toEqual(mockGame);
      expect(GameRepository.equipCard).toHaveBeenCalledWith(gameId, cardId, slot);
    });

    it('should throw ValidationError for invalid slot type', async () => {
      const gameId = 1;
      const cardId = 10;
      const invalidSlot = 'invalid-slot-type';

      await expect(
        GameService.equipCard(gameId, cardId, invalidSlot)
      ).rejects.toThrow();
    });

    it('should throw ValidationError for invalid gameId', async () => {
      await expect(GameService.equipCard(null, 10, 'hp')).rejects.toThrow();
      await expect(GameService.equipCard(0, 10, 'hp')).rejects.toThrow();
      await expect(GameService.equipCard(-1, 10, 'hp')).rejects.toThrow();
    });

    it('should throw ValidationError for invalid cardId', async () => {
      await expect(GameService.equipCard(1, null, 'hp')).rejects.toThrow();
      await expect(GameService.equipCard(1, 0, 'hp')).rejects.toThrow();
      await expect(GameService.equipCard(1, -1, 'hp')).rejects.toThrow();
    });
  });

  describe('replenishTavern', () => {
    it('should fill empty tavern positions with new cards', async () => {
      const gameId = 1;
      const currentTavern = [
        { id: 1, position: 0 },
        { id: 2, position: 1 },
      ];

      const mockGame = {
        ...global.testUtils.createMockGame({ id: gameId }),
        tavern: currentTavern,
        hand: [],
      };

      const newCards = Array(7)
        .fill(0)
        .map((_, i) => ({
          id: i + 10,
          name: `New Card ${i}`,
          hp: 10,
          shield: 5,
        }));

      GameRepository.findById.mockResolvedValue(mockGame);
      CardService.getRandomCards.mockResolvedValue(newCards);
      GameRepository.addTavernCard.mockResolvedValue();

      await GameService.replenishTavern(gameId);

      expect(CardService.getRandomCards).toHaveBeenCalledWith(
        7,
        expect.arrayContaining([1, 2])
      );
      expect(GameRepository.addTavernCard).toHaveBeenCalledTimes(7);
    });

    it('should not add cards if tavern is full', async () => {
      const gameId = 1;
      const fullTavern = Array(9)
        .fill(0)
        .map((_, i) => ({ id: i + 1, position: i }));

      const mockGame = {
        ...global.testUtils.createMockGame({ id: gameId }),
        tavern: fullTavern,
        hand: [],
      };

      GameRepository.findById.mockResolvedValue(mockGame);

      await GameService.replenishTavern(gameId);

      expect(CardService.getRandomCards).not.toHaveBeenCalled();
      expect(GameRepository.addTavernCard).not.toHaveBeenCalled();
    });

    it('should exclude cards from player hand', async () => {
      const gameId = 1;
      const currentTavern = [{ id: 1, position: 0 }];
      const handCards = [{ id: 20 }, { id: 21 }];

      const mockGame = {
        ...global.testUtils.createMockGame({ id: gameId }),
        tavern: currentTavern,
        hand: handCards,
      };

      const newCards = Array(8)
        .fill(0)
        .map((_, i) => ({ id: i + 10, hp: 10, shield: 5 }));

      GameRepository.findById.mockResolvedValue(mockGame);
      CardService.getRandomCards.mockResolvedValue(newCards);
      GameRepository.addTavernCard.mockResolvedValue();

      await GameService.replenishTavern(gameId);

      expect(CardService.getRandomCards).toHaveBeenCalledWith(
        8,
        expect.arrayContaining([1, 20, 21])
      );
    });
  });

  describe('updatePlayerHP', () => {
    it('should update player HP to valid value', async () => {
      const gameId = 1;
      const newHP = 50;
      const mockGame = global.testUtils.createMockGame({
        id: gameId,
        player_current_hp: 100,
        player_max_hp: 100,
      });

      GameRepository.findById.mockResolvedValue(mockGame);
      GameRepository.update.mockResolvedValue();

      const result = await GameService.updatePlayerHP(gameId, newHP);

      expect(GameRepository.update).toHaveBeenCalledWith(gameId, {
        player_current_hp: newHP,
      });
    });

    it('should trigger defeat phase when HP reaches 0', async () => {
      const gameId = 1;
      const mockGame = global.testUtils.createMockGame({
        id: gameId,
        player_current_hp: 100,
        player_max_hp: 100,
      });

      GameRepository.findById.mockResolvedValue(mockGame);
      GameRepository.update.mockResolvedValue();

      await GameService.updatePlayerHP(gameId, 0);

      expect(GameRepository.update).toHaveBeenCalledWith(gameId, {
        player_current_hp: 0,
      });
      expect(GameRepository.update).toHaveBeenCalledWith(gameId, { phase: 'defeat' });
    });

    it('should clamp HP to valid range', async () => {
      const gameId = 1;
      const mockGame = global.testUtils.createMockGame({
        id: gameId,
        player_current_hp: 100,
        player_max_hp: 100,
      });

      GameRepository.findById.mockResolvedValue(mockGame);
      GameRepository.update.mockResolvedValue();

      // Test clamping to max HP
      await GameService.updatePlayerHP(gameId, 150);
      expect(GameRepository.update).toHaveBeenCalledWith(gameId, {
        player_current_hp: 100, // Should be clamped to max
      });
    });

    it('should throw ValidationError for invalid HP values', async () => {
      await expect(GameService.updatePlayerHP(1, null)).rejects.toThrow();
      await expect(GameService.updatePlayerHP(1, undefined)).rejects.toThrow();
      await expect(GameService.updatePlayerHP(1, -10)).rejects.toThrow();
    });
  });

  describe('advanceTurn', () => {
    it('should increment turn counter', async () => {
      const gameId = 1;
      const mockGame = global.testUtils.createMockGame({
        id: gameId,
        current_turn: 5,
      });

      GameRepository.findById
        .mockResolvedValueOnce(mockGame)
        .mockResolvedValueOnce({ ...mockGame, current_turn: 6 });
      GameRepository.update.mockResolvedValue();

      const result = await GameService.advanceTurn(gameId);

      expect(GameRepository.update).toHaveBeenCalledWith(gameId, {
        current_turn: 6,
      });
      expect(result.current_turn).toBe(6);
    });
  });
});
