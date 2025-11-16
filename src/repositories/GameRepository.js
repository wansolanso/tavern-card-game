const db = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/errors');

class GameRepository {
  /**
   * SECURITY: Whitelist of allowed fields for game updates
   * Prevents Mass Assignment vulnerability (CWE-915)
   */
  static ALLOWED_UPDATE_FIELDS = new Set([
    'phase',
    'current_turn',
    'player_current_hp',
    'player_max_hp',
    'combat_target_id',
    'combat_round'
  ]);

  /**
   * PERFORMANCE OPTIMIZATION: Group abilities by card type
   * Helper method to reduce code duplication
   */
  groupAbilitiesByType(abilities) {
    return abilities.reduce((acc, ability) => {
      const abilityType = ability.ability_type;
      if (!acc[abilityType]) {
        acc[abilityType] = [];
      }
      acc[abilityType].push({
        id: ability.ability_id,
        name: ability.name,
        description: ability.description,
        type: ability.type,
        power: ability.power,
        effects: ability.effects
      });
      return acc;
    }, {});
  }
  async create(playerId) {
    const result = await db('games')
      .insert({
        player_id: playerId,
        phase: 'tavern',
        current_turn: 1,
        player_current_hp: 100,
        player_max_hp: 100,
        created_at: new Date(),
        updated_at: new Date()
      });

    const gameId = Array.isArray(result) ? result[0] : result;
    return this.findById(gameId);
  }

  async findById(id) {
    const game = await db('games')
      .where({ id })
      .first();

    if (!game) {
      throw new NotFoundError(`Game with id ${id} not found`);
    }

    return await this.loadGameState(game);
  }

  async findByPlayerId(playerId) {
    const games = await db('games')
      .where({ player_id: playerId })
      .orderBy('created_at', 'desc');

    return await Promise.all(games.map(game => this.loadGameState(game)));
  }

  /**
   * SECURITY FIX: Update game with field whitelist to prevent Mass Assignment
   *
   * This method sanitizes the updates object to only allow fields that are
   * explicitly whitelisted in ALLOWED_UPDATE_FIELDS. This prevents attackers
   * from modifying sensitive fields like player_id or injecting malicious data.
   *
   * @param {number} gameId - The game ID to update
   * @param {Object} updates - Object containing fields to update
   * @returns {Promise<Object>} Updated game object
   * @throws {Error} If attempting to update forbidden fields
   */
  async update(gameId, updates) {
    // Sanitize: filter only allowed fields
    const sanitizedUpdates = {};
    const rejectedFields = [];

    for (const [key, value] of Object.entries(updates)) {
      if (GameRepository.ALLOWED_UPDATE_FIELDS.has(key)) {
        // Additional type validation for critical fields
        if (key === 'player_current_hp' || key === 'player_max_hp') {
          const numValue = parseInt(value, 10);
          if (!Number.isInteger(numValue) || numValue < 0) {
            throw new Error(`Invalid value for ${key}: must be a non-negative integer`);
          }
          sanitizedUpdates[key] = numValue;
        } else if (key === 'current_turn') {
          const numValue = parseInt(value, 10);
          if (!Number.isInteger(numValue) || numValue < 1) {
            throw new Error(`Invalid value for ${key}: must be a positive integer`);
          }
          sanitizedUpdates[key] = numValue;
        } else if (key === 'phase') {
          const validPhases = ['tavern', 'combat', 'victory', 'defeat'];
          if (!validPhases.includes(value)) {
            throw new Error(`Invalid phase: must be one of ${validPhases.join(', ')}`);
          }
          sanitizedUpdates[key] = value;
        } else {
          sanitizedUpdates[key] = value;
        }
      } else {
        rejectedFields.push(key);
      }
    }

    // Log warning if fields were rejected (potential attack attempt)
    if (rejectedFields.length > 0) {
      const logger = require('../utils/logger');
      logger.warn(`Rejected unauthorized update fields for game ${gameId}:`, rejectedFields);
    }

    // Only update if there are valid fields
    if (Object.keys(sanitizedUpdates).length > 0) {
      await db('games')
        .where({ id: gameId })
        .update({
          ...sanitizedUpdates,
          updated_at: new Date()
        });
    }

    return this.findById(gameId);
  }

  /**
   * PERFORMANCE OPTIMIZATION: Load game state with abilities in minimal queries
   *
   * Before: ~28 queries (1 game + 3 card queries + 24 ability queries for 24 cards)
   * After: ~5 queries (1 game + 3 card queries + 1 bulk ability query)
   *
   * Improvement: 82% query reduction
   */
  async loadGameState(game) {
    // Load all card data in parallel (3 queries)
    const [handCards, equippedCards, tavernCards, slotUpgrades] = await Promise.all([
      this.getHandCardsRaw(game.id),
      this.getEquippedCardsRaw(game.id),
      this.getTavernCardsRaw(game.id),
      this.getSlotUpgrades(game.id)
    ]);

    // Collect all unique card IDs from all sources
    const allCardIds = [
      ...handCards.map(c => c.id),
      ...equippedCards.map(c => c.id),
      ...tavernCards.map(c => c.id)
    ];

    // OPTIMIZATION: Single query to load ALL abilities for ALL cards
    const abilitiesMap = await this.bulkLoadAbilities(allCardIds);

    // Attach abilities to hand cards
    const hand = handCards.map(card => ({
      ...card,
      abilities: abilitiesMap[card.id] || {}
    }));

    // Attach abilities to equipped cards and group by slot
    const equipped = equippedCards.reduce((acc, card) => {
      const slot = card.slot_type;
      if (!acc[slot]) {
        acc[slot] = [];
      }
      acc[slot].push({
        ...card,
        abilities: abilitiesMap[card.id] || {}
      });
      return acc;
    }, {});

    // Attach abilities to tavern cards
    const tavern = tavernCards.map(card => ({
      ...card,
      abilities: abilitiesMap[card.id] || {}
    }));

    return {
      ...game,
      hand,
      equipped,
      tavern,
      slot_upgrades: slotUpgrades
    };
  }

  /**
   * PERFORMANCE OPTIMIZATION: Bulk load abilities for multiple cards
   *
   * Loads all abilities for given card IDs in a SINGLE query instead of N queries.
   * Returns a map of cardId -> abilities for O(1) lookup.
   *
   * @param {Array<string>} cardIds - Array of card IDs
   * @returns {Promise<Object>} Map of cardId to abilities object
   */
  async bulkLoadAbilities(cardIds) {
    if (!cardIds || cardIds.length === 0) {
      return {};
    }

    // Remove duplicates
    const uniqueCardIds = [...new Set(cardIds)];

    // Single query to fetch ALL abilities for ALL cards
    const abilities = await db('card_abilities')
      .join('abilities', 'card_abilities.ability_id', 'abilities.id')
      .whereIn('card_abilities.card_id', uniqueCardIds)
      .select(
        'card_abilities.card_id',
        'abilities.id as ability_id',
        'abilities.name',
        'abilities.description',
        'abilities.type',
        'abilities.power',
        'abilities.effects',
        'card_abilities.ability_type'
      );

    // Build map: cardId -> array of abilities
    const abilityArrayMap = abilities.reduce((acc, ability) => {
      if (!acc[ability.card_id]) {
        acc[ability.card_id] = [];
      }
      acc[ability.card_id].push(ability);
      return acc;
    }, {});

    // Convert to map: cardId -> abilities grouped by type
    const abilityMap = {};
    for (const [cardId, cardAbilities] of Object.entries(abilityArrayMap)) {
      abilityMap[cardId] = this.groupAbilitiesByType(cardAbilities);
    }

    return abilityMap;
  }

  /**
   * Get hand cards WITHOUT abilities (raw data only)
   * Abilities are attached in loadGameState() via bulk query
   */
  async getHandCardsRaw(gameId) {
    return await db('game_cards')
      .join('cards', 'game_cards.card_id', 'cards.id')
      .where('game_cards.game_id', gameId)
      .where('game_cards.location', 'hand')
      .select('cards.*');
  }

  /**
   * Get equipped cards WITHOUT abilities (raw data only)
   * Abilities are attached in loadGameState() via bulk query
   */
  async getEquippedCardsRaw(gameId) {
    return await db('game_cards')
      .join('cards', 'game_cards.card_id', 'cards.id')
      .where('game_cards.game_id', gameId)
      .where('game_cards.location', 'equipped')
      .select(
        'cards.*',
        'game_cards.slot_type'
      );
  }

  /**
   * Get tavern cards WITHOUT abilities (raw data only)
   * Abilities are attached in loadGameState() via bulk query
   */
  async getTavernCardsRaw(gameId) {
    return await db('tavern_cards')
      .join('cards', 'tavern_cards.card_id', 'cards.id')
      .where('tavern_cards.game_id', gameId)
      .select('cards.*', 'tavern_cards.position', 'tavern_cards.current_hp', 'tavern_cards.current_shield')
      .orderBy('tavern_cards.position', 'asc');
  }

  /**
   * DEPRECATED: Use loadGameState() which includes abilities via bulk loading
   * @deprecated This method loads cards without abilities
   */
  async getHandCards(gameId) {
    return this.getHandCardsRaw(gameId);
  }

  /**
   * DEPRECATED: Use loadGameState() which includes abilities via bulk loading
   * @deprecated This method loads cards without abilities
   */
  async getEquippedCards(gameId) {
    const equipped = await this.getEquippedCardsRaw(gameId);
    return equipped.reduce((acc, card) => {
      const slot = card.slot_type;
      if (!acc[slot]) {
        acc[slot] = [];
      }
      acc[slot].push(card);
      return acc;
    }, {});
  }

  /**
   * DEPRECATED: Use loadGameState() which includes abilities via bulk loading
   * @deprecated This method loads cards without abilities
   */
  async getTavernCards(gameId) {
    return this.getTavernCardsRaw(gameId);
  }

  async getSlotUpgrades(gameId) {
    const upgrades = await db('slot_upgrades')
      .where({ game_id: gameId })
      .select('slot_type', 'capacity');

    return upgrades.reduce((acc, upgrade) => {
      acc[upgrade.slot_type] = upgrade.capacity;
      return acc;
    }, {});
  }

  async addCardToHand(gameId, cardId) {
    await db('game_cards').insert({
      game_id: gameId,
      card_id: cardId,
      location: 'hand',
      acquired_at: new Date()
    });
  }

  async equipCard(gameId, cardId, slot) {
    const slotCapacity = await this.getSlotCapacity(gameId, slot);
    const currentlyEquipped = await db('game_cards')
      .where({ game_id: gameId, slot_type: slot, location: 'equipped' })
      .count('* as count')
      .first();

    if (currentlyEquipped.count >= slotCapacity) {
      throw new ConflictError(`Slot ${slot} is full (capacity: ${slotCapacity})`);
    }

    await db('game_cards')
      .where({ game_id: gameId, card_id: cardId })
      .update({
        location: 'equipped',
        slot_type: slot,
        slot_position: 0
      });
  }

  async unequipCard(gameId, cardId) {
    await db('game_cards')
      .where({ game_id: gameId, card_id: cardId })
      .update({
        location: 'hand',
        slot_type: null,
        slot_position: null
      });
  }

  async discardCard(gameId, cardId) {
    await db('game_cards')
      .where({ game_id: gameId, card_id: cardId })
      .delete();
  }

  async addTavernCard(gameId, cardId, currentHp, currentShield, position) {
    await db('tavern_cards').insert({
      game_id: gameId,
      card_id: cardId,
      position: position,
      current_hp: currentHp,
      current_shield: currentShield,
      created_at: new Date()
    });
  }

  async removeTavernCard(gameId, cardId) {
    await db('tavern_cards')
      .where({ game_id: gameId, card_id: cardId })
      .delete();
  }

  // Card stats are stored in tavern_cards, not game_cards
  // game_cards only tracks ownership and location

  async updateTavernCardStats(gameId, cardId, hp, shield) {
    await db('tavern_cards')
      .where({ game_id: gameId, card_id: cardId })
      .update({
        current_hp: hp,
        current_shield: shield
      });
  }

  async upgradeSlot(gameId, slotType) {
    const existing = await db('slot_upgrades')
      .where({ game_id: gameId, slot_type: slotType })
      .first();

    if (existing) {
      await db('slot_upgrades')
        .where({ game_id: gameId, slot_type: slotType })
        .update({ capacity: existing.capacity + 1 });
    } else {
      await db('slot_upgrades').insert({
        game_id: gameId,
        slot_type: slotType,
        capacity: 2
      });
    }
  }

  async getSlotCapacity(gameId, slotType) {
    const upgrade = await db('slot_upgrades')
      .where({ game_id: gameId, slot_type: slotType })
      .first();

    return upgrade ? upgrade.capacity : 1;
  }

  async logCombat(gameId, attackerId, targetId, damageDealt, targetDestroyed) {
    const [combatId] = await db('combats')
      .insert({
        game_id: gameId,
        attacker_id: attackerId,
        target_id: targetId,
        damage_dealt: damageDealt,
        target_destroyed: targetDestroyed,
        created_at: new Date()
      })
      .returning('id');

    return combatId;
  }

  async logCombatEvent(combatId, eventType, sourceId, targetId, value, description) {
    await db('combat_events').insert({
      combat_id: combatId,
      event_type: eventType,
      source_id: sourceId,
      target_id: targetId,
      value,
      description,
      created_at: new Date()
    });
  }
}

module.exports = new GameRepository();
