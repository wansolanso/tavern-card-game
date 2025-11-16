const CardService = require('../CardService');
const CardRepository = require('../../repositories/CardRepository');

jest.mock('../../repositories/CardRepository');

describe('CardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCards', () => {
    it('should retrieve all cards from repository', async () => {
      const mockCards = [
        { id: 1, name: 'Card 1', type: 'character' },
        { id: 2, name: 'Card 2', type: 'character' },
        { id: 3, name: 'Card 3', type: 'boss' },
      ];

      CardRepository.getAllCards.mockResolvedValue(mockCards);

      const result = await CardService.getAllCards();

      expect(result).toEqual(mockCards);
      expect(result).toHaveLength(3);
      expect(CardRepository.getAllCards).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database connection failed');
      CardRepository.getAllCards.mockRejectedValue(error);

      await expect(CardService.getAllCards()).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getCardById', () => {
    it('should retrieve specific card by ID', async () => {
      const mockCard = {
        id: 42,
        name: 'Test Card',
        type: 'character',
        hp: 20,
        shield: 10,
      };

      CardRepository.findById.mockResolvedValue(mockCard);

      const result = await CardService.getCardById(42);

      expect(result).toEqual(mockCard);
      expect(CardRepository.findById).toHaveBeenCalledWith(42);
    });

    it('should throw ValidationError for invalid ID', async () => {
      await expect(CardService.getCardById(null)).rejects.toThrow();
      await expect(CardService.getCardById(undefined)).rejects.toThrow();
      await expect(CardService.getCardById(0)).rejects.toThrow();
      await expect(CardService.getCardById(-5)).rejects.toThrow();
      await expect(CardService.getCardById('not-a-number')).rejects.toThrow();
    });

    it('should handle card not found errors', async () => {
      CardRepository.findById.mockRejectedValue(new Error('Card not found'));

      await expect(CardService.getCardById(999)).rejects.toThrow('Card not found');
    });
  });

  describe('getCardsByRarity', () => {
    it('should retrieve cards by rarity', async () => {
      const mockCards = [
        { id: 1, name: 'Common 1', rarity: 'common' },
        { id: 2, name: 'Common 2', rarity: 'common' },
      ];

      CardRepository.getCardsByRarity.mockResolvedValue(mockCards);

      const result = await CardService.getCardsByRarity('common');

      expect(result).toEqual(mockCards);
      expect(CardRepository.getCardsByRarity).toHaveBeenCalledWith('common');
    });

    it('should throw ValidationError for empty rarity', async () => {
      await expect(CardService.getCardsByRarity('')).rejects.toThrow();
      await expect(CardService.getCardsByRarity(null)).rejects.toThrow();
      await expect(CardService.getCardsByRarity(undefined)).rejects.toThrow();
    });

    it('should return empty array for non-existent rarity', async () => {
      CardRepository.getCardsByRarity.mockResolvedValue([]);

      const result = await CardService.getCardsByRarity('non-existent');

      expect(result).toEqual([]);
    });
  });

  describe('getRegularCards', () => {
    it('should retrieve only regular (non-boss) cards', async () => {
      const mockCards = [
        { id: 1, name: 'Regular 1', type: 'character' },
        { id: 2, name: 'Regular 2', type: 'character' },
      ];

      CardRepository.getRegularCards.mockResolvedValue(mockCards);

      const result = await CardService.getRegularCards();

      expect(result).toEqual(mockCards);
      expect(CardRepository.getRegularCards).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBossCards', () => {
    it('should retrieve only boss cards', async () => {
      const mockCards = [
        { id: 100, name: 'Boss 1', type: 'boss' },
        { id: 101, name: 'Boss 2', type: 'boss' },
      ];

      CardRepository.getBossCards.mockResolvedValue(mockCards);

      const result = await CardService.getBossCards();

      expect(result).toEqual(mockCards);
      expect(CardRepository.getBossCards).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRandomCards', () => {
    it('should retrieve random cards without exclusions', async () => {
      const count = 5;
      const mockCards = Array(count)
        .fill(0)
        .map((_, i) => ({ id: i + 1, name: `Card ${i + 1}` }));

      CardRepository.getRandomCards.mockResolvedValue(mockCards);

      const result = await CardService.getRandomCards(count);

      expect(result).toHaveLength(count);
      expect(CardRepository.getRandomCards).toHaveBeenCalledWith(count, []);
    });

    it('should retrieve random cards with exclusions', async () => {
      const count = 3;
      const excludeIds = [1, 2, 3];
      const mockCards = [
        { id: 4, name: 'Card 4' },
        { id: 5, name: 'Card 5' },
        { id: 6, name: 'Card 6' },
      ];

      CardRepository.getRandomCards.mockResolvedValue(mockCards);

      const result = await CardService.getRandomCards(count, excludeIds);

      expect(result).toHaveLength(count);
      expect(CardRepository.getRandomCards).toHaveBeenCalledWith(count, excludeIds);

      // Verify excluded IDs are not in result
      result.forEach(card => {
        expect(excludeIds).not.toContain(card.id);
      });
    });

    it('should throw ValidationError for invalid count', async () => {
      await expect(CardService.getRandomCards(0)).rejects.toThrow();
      await expect(CardService.getRandomCards(-5)).rejects.toThrow();
      await expect(CardService.getRandomCards(null)).rejects.toThrow();
      await expect(CardService.getRandomCards(undefined)).rejects.toThrow();
    });

    it('should throw ValidationError if excludeIds is not an array', async () => {
      await expect(CardService.getRandomCards(5, 'not-an-array')).rejects.toThrow();
      await expect(CardService.getRandomCards(5, 123)).rejects.toThrow();
      await expect(CardService.getRandomCards(5, { id: 1 })).rejects.toThrow();
    });

    it('should handle empty excludeIds array', async () => {
      const count = 3;
      const mockCards = [
        { id: 1, name: 'Card 1' },
        { id: 2, name: 'Card 2' },
        { id: 3, name: 'Card 3' },
      ];

      CardRepository.getRandomCards.mockResolvedValue(mockCards);

      const result = await CardService.getRandomCards(count, []);

      expect(result).toHaveLength(count);
      expect(CardRepository.getRandomCards).toHaveBeenCalledWith(count, []);
    });
  });

  describe('warmCache', () => {
    it('should warm cache with all card types', async () => {
      CardRepository.getAllCards.mockResolvedValue([]);
      CardRepository.getRegularCards.mockResolvedValue([]);
      CardRepository.getBossCards.mockResolvedValue([]);
      CardRepository.getCardsByRarity.mockResolvedValue([]);

      await CardService.warmCache();

      expect(CardRepository.getAllCards).toHaveBeenCalled();
      expect(CardRepository.getRegularCards).toHaveBeenCalled();
      expect(CardRepository.getBossCards).toHaveBeenCalled();
    });

    it('should not throw error if cache warming fails', async () => {
      CardRepository.getAllCards.mockRejectedValue(new Error('Cache error'));

      // Should not throw
      await expect(CardService.warmCache()).resolves.not.toThrow();
    });
  });
});
