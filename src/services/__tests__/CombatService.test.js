const CombatService = require('../CombatService');
const GameRepository = require('../../repositories/GameRepository');
const GameService = require('../GameService');

jest.mock('../../repositories/GameRepository');
jest.mock('../GameService');

describe('CombatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePlayerAttack', () => {
    it('should calculate total attack from equipped HP cards', () => {
      const game = {
        equipped: {
          hp: [
            { id: 1, hp: 10 },
            { id: 2, hp: 15 },
            { id: 3, hp: 20 },
          ],
          shield: [],
          special: [],
        },
      };

      const result = CombatService.calculatePlayerAttack(game);

      expect(result).toBe(45); // 10 + 15 + 20
    });

    it('should return 0 if no HP cards equipped', () => {
      const game = {
        equipped: {
          hp: [],
          shield: [],
          special: [],
        },
      };

      const result = CombatService.calculatePlayerAttack(game);

      expect(result).toBe(0);
    });

    it('should handle missing equipped object', () => {
      const game = { equipped: {} };

      const result = CombatService.calculatePlayerAttack(game);

      expect(result).toBe(0);
    });
  });

  describe('calculateDamage', () => {
    it('should calculate damage after shield reduction', () => {
      const attackPower = 30;
      const targetShield = 10;

      const result = CombatService.calculateDamage(attackPower, targetShield);

      expect(result).toEqual({
        damage: 20,
        shieldBlocked: 10,
      });
    });

    it('should return 0 damage if shield blocks all attack', () => {
      const attackPower = 10;
      const targetShield = 15;

      const result = CombatService.calculateDamage(attackPower, targetShield);

      expect(result).toEqual({
        damage: 0,
        shieldBlocked: 10,
      });
    });

    it('should deal full damage if target has no shield', () => {
      const attackPower = 25;
      const targetShield = 0;

      const result = CombatService.calculateDamage(attackPower, targetShield);

      expect(result).toEqual({
        damage: 25,
        shieldBlocked: 0,
      });
    });

    it('should return 0 damage if shield equals attack power', () => {
      const attackPower = 20;
      const targetShield = 20;

      const result = CombatService.calculateDamage(attackPower, targetShield);

      expect(result).toEqual({
        damage: 0,
        shieldBlocked: 20,
      });
    });
  });

  describe('calculatePlayerShield', () => {
    it('should calculate total shield from equipped shield cards', () => {
      const game = {
        equipped: {
          hp: [],
          shield: [
            { id: 1, shield: 5 },
            { id: 2, shield: 8 },
          ],
          special: [],
        },
      };

      const result = CombatService.calculatePlayerShield(game);

      expect(result).toBe(13); // 5 + 8
    });

    it('should return 0 if no shield cards equipped', () => {
      const game = {
        equipped: {
          hp: [],
          shield: [],
          special: [],
        },
      };

      const result = CombatService.calculatePlayerShield(game);

      expect(result).toBe(0);
    });
  });

  describe('attackTavernCard', () => {
    it('should successfully attack and defeat a tavern card', async () => {
      const gameId = 1;
      const targetCardId = 10;

      const mockGame = {
        id: gameId,
        player_current_hp: 100,
        current_turn: 1,
        equipped: {
          hp: [{ id: 1, hp: 30 }],
          shield: [],
          special: [],
        },
        tavern: [
          {
            id: targetCardId,
            name: 'Weak Card',
            current_hp: 15,
            current_shield: 5,
            abilities: { normal: [], special: [], passive: [] },
          },
        ],
      };

      GameService.getGame.mockResolvedValue(mockGame);
      GameRepository.logCombat.mockResolvedValue(1);
      GameRepository.logCombatEvent.mockResolvedValue();
      GameRepository.removeTavernCard.mockResolvedValue();
      GameRepository.addCardToHand.mockResolvedValue();
      GameService.replenishTavern.mockResolvedValue();
      GameService.advanceTurn.mockResolvedValue();

      const result = await CombatService.attackTavernCard(gameId, targetCardId);

      expect(result).toHaveProperty('game');
      expect(result).toHaveProperty('combatLog');
      expect(result).toHaveProperty('targetDestroyed');
      expect(result.targetDestroyed).toBe(true);
      expect(GameRepository.removeTavernCard).toHaveBeenCalledWith(gameId, targetCardId);
      expect(GameRepository.addCardToHand).toHaveBeenCalledWith(gameId, targetCardId);
      expect(GameService.replenishTavern).toHaveBeenCalledWith(gameId);
    });

    it('should damage but not destroy card with high HP', async () => {
      const gameId = 1;
      const targetCardId = 20;

      const mockGame = {
        id: gameId,
        player_current_hp: 100,
        current_turn: 1,
        equipped: {
          hp: [{ id: 1, hp: 10 }],
          shield: [],
          special: [],
        },
        tavern: [
          {
            id: targetCardId,
            name: 'Strong Card',
            current_hp: 50,
            current_shield: 5,
            shield: 5,
            abilities: { normal: [], special: [], passive: [] },
          },
        ],
      };

      GameService.getGame.mockResolvedValue(mockGame);
      GameRepository.logCombat.mockResolvedValue(1);
      GameRepository.logCombatEvent.mockResolvedValue();
      GameRepository.updateTavernCardStats.mockResolvedValue();
      GameService.advanceTurn.mockResolvedValue();

      const result = await CombatService.attackTavernCard(gameId, targetCardId);

      expect(result.targetDestroyed).toBe(false);
      expect(GameRepository.updateTavernCardStats).toHaveBeenCalled();
      expect(GameRepository.removeTavernCard).not.toHaveBeenCalled();
    });

    it('should throw error if target card not in tavern', async () => {
      const gameId = 1;
      const targetCardId = 999;

      const mockGame = {
        id: gameId,
        equipped: {
          hp: [{ id: 1, hp: 10 }],
          shield: [],
          special: [],
        },
        tavern: [],
      };

      GameService.getGame.mockResolvedValue(mockGame);

      await expect(
        CombatService.attackTavernCard(gameId, targetCardId)
      ).rejects.toThrow();
    });

    it('should throw error if player has no attack power', async () => {
      const gameId = 1;
      const targetCardId = 10;

      const mockGame = {
        id: gameId,
        equipped: {
          hp: [], // No cards equipped
          shield: [],
          special: [],
        },
        tavern: [
          {
            id: targetCardId,
            name: 'Test Card',
            current_hp: 15,
            current_shield: 5,
          },
        ],
      };

      GameService.getGame.mockResolvedValue(mockGame);

      await expect(
        CombatService.attackTavernCard(gameId, targetCardId)
      ).rejects.toThrow();
    });

    it('should throw ValidationError for invalid parameters', async () => {
      await expect(CombatService.attackTavernCard(null, 10)).rejects.toThrow();
      await expect(CombatService.attackTavernCard(1, null)).rejects.toThrow();
      await expect(CombatService.attackTavernCard(0, 10)).rejects.toThrow();
      await expect(CombatService.attackTavernCard(1, 0)).rejects.toThrow();
    });
  });

  describe('applyAbility', () => {
    it('should apply damage ability correctly', () => {
      const ability = {
        name: 'Fireball',
        type: 'damage',
        power: 20,
      };

      const game = {
        equipped: {
          hp: [],
          shield: [{ id: 1, shield: 5 }],
          special: [],
        },
      };

      const combatLog = [];

      const effects = CombatService.applyAbility(
        ability,
        game,
        combatLog,
        'Fire Mage'
      );

      expect(effects).toEqual({ damage: 15, heal: 0, shield: 0 }); // 20 - 5 shield
      expect(combatLog).toHaveLength(1);
      expect(combatLog[0]).toMatchObject({
        actor: 'enemy',
        action: 'ability',
        source: 'Fire Mage',
        ability: 'Fireball',
        damage: 15,
      });
    });

    it('should handle heal ability', () => {
      const ability = {
        name: 'Regeneration',
        type: 'heal',
        power: 10,
      };

      const game = { equipped: { hp: [], shield: [], special: [] } };
      const combatLog = [];

      const effects = CombatService.applyAbility(
        ability,
        game,
        combatLog,
        'Healer'
      );

      expect(effects).toEqual({ damage: 0, heal: 10, shield: 0 });
      expect(combatLog).toHaveLength(1);
      expect(combatLog[0].ability).toBe('Regeneration');
      expect(combatLog[0].heal).toBe(10);
    });

    it('should handle shield ability', () => {
      const ability = {
        name: 'Shield Wall',
        type: 'shield',
        power: 15,
      };

      const game = { equipped: { hp: [], shield: [], special: [] } };
      const combatLog = [];

      const effects = CombatService.applyAbility(
        ability,
        game,
        combatLog,
        'Guardian'
      );

      expect(effects).toEqual({ damage: 0, heal: 0, shield: 15 });
      expect(combatLog).toHaveLength(1);
      expect(combatLog[0].ability).toBe('Shield Wall');
      expect(combatLog[0].shield).toBe(15);
    });
  });
});
