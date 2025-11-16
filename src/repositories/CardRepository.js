const db = require('../config/database');
const { NotFoundError } = require('../utils/errors');

class CardRepository {
  /**
   * PERFORMANCE OPTIMIZATION: Bulk load abilities to prevent N+1 queries
   *
   * Loads abilities for multiple cards in a single query instead of N queries.
   * Reduces query count from O(N+1) to O(2) where N = number of cards.
   *
   * @param {Array<Object>} cards - Array of card objects
   * @returns {Promise<Array<Object>>} Cards with abilities attached
   */
  async bulkAttachAbilities(cards) {
    if (!cards || cards.length === 0) {
      return [];
    }

    const cardIds = cards.map(c => c.id);

    // Single query to fetch ALL abilities for ALL cards
    const abilities = await db('card_abilities')
      .join('abilities', 'card_abilities.ability_id', 'abilities.id')
      .whereIn('card_abilities.card_id', cardIds)
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

    // Build ability map for O(1) lookup (in-memory join - very fast)
    const abilityMap = abilities.reduce((acc, ability) => {
      if (!acc[ability.card_id]) {
        acc[ability.card_id] = [];
      }
      acc[ability.card_id].push({
        id: ability.ability_id,
        name: ability.name,
        description: ability.description,
        type: ability.type,
        power: ability.power,
        effects: ability.effects,
        ability_type: ability.ability_type
      });
      return acc;
    }, {});

    // Attach abilities to each card
    return cards.map(card => ({
      ...card,
      abilities: this.groupAbilitiesByType(abilityMap[card.id] || [])
    }));
  }

  /**
   * Groups abilities by their type (special, passive, normal)
   * @param {Array} abilities - Array of ability objects
   * @returns {Object} Abilities grouped by type
   */
  groupAbilitiesByType(abilities) {
    return abilities.reduce((acc, ability) => {
      const abilityType = ability.ability_type;
      if (!acc[abilityType]) {
        acc[abilityType] = [];
      }
      acc[abilityType].push({
        id: ability.id,
        name: ability.name,
        description: ability.description,
        type: ability.type,
        power: ability.power,
        effects: ability.effects
      });
      return acc;
    }, {});
  }

  async getAllCards() {
    const cards = await db('cards')
      .select('*')
      .orderBy('rarity', 'desc')
      .orderBy('name', 'asc');

    // OPTIMIZED: Bulk load abilities instead of N+1 queries
    return await this.bulkAttachAbilities(cards);
  }

  async findById(id) {
    const card = await db('cards')
      .where({ id })
      .first();

    if (!card) {
      throw new NotFoundError(`Card with id ${id} not found`);
    }

    // OPTIMIZED: Use bulk attach even for single card for consistency
    const cardsWithAbilities = await this.bulkAttachAbilities([card]);
    return cardsWithAbilities[0];
  }

  async findByIds(ids) {
    const cards = await db('cards')
      .whereIn('id', ids);

    // OPTIMIZED: Bulk load abilities instead of N+1 queries
    return await this.bulkAttachAbilities(cards);
  }

  async getCardsByRarity(rarity) {
    const cards = await db('cards')
      .where({ rarity })
      .select('*');

    // OPTIMIZED: Bulk load abilities instead of N+1 queries
    return await this.bulkAttachAbilities(cards);
  }

  async getRegularCards() {
    const cards = await db('cards')
      .where('is_boss', false)
      .select('*');

    // OPTIMIZED: Bulk load abilities instead of N+1 queries
    return await this.bulkAttachAbilities(cards);
  }

  async getBossCards() {
    const cards = await db('cards')
      .where('is_boss', true)
      .select('*');

    // OPTIMIZED: Bulk load abilities instead of N+1 queries
    return await this.bulkAttachAbilities(cards);
  }

  /**
   * DEPRECATED: Use bulkAttachAbilities() instead to prevent N+1 queries
   *
   * This method is kept for backward compatibility but should not be used in loops.
   * For multiple cards, always use bulkAttachAbilities().
   *
   * @deprecated Use bulkAttachAbilities([card])[0] instead
   */
  async attachAbilities(card) {
    // Use optimized bulk method even for single card
    const cardsWithAbilities = await this.bulkAttachAbilities([card]);
    return cardsWithAbilities[0];
  }

  /**
   * Get random cards with optional exclusion list
   * @param {number} count - Number of cards to retrieve
   * @param {Array<number|string>} excludeIds - IDs to exclude from selection
   * @returns {Promise<Array>} Array of random cards with abilities
   *
   * Security: Uses Knex parameterized queries to prevent SQL injection.
   * The whereNotIn() method safely sanitizes the excludeIds array.
   */
  async getRandomCards(count, excludeIds = []) {
    // Validate count parameter
    const safeCount = parseInt(count, 10);
    if (!Number.isInteger(safeCount) || safeCount < 1 || safeCount > 100) {
      throw new Error('Invalid count parameter: must be an integer between 1 and 100');
    }

    // Validate excludeIds is an array
    if (!Array.isArray(excludeIds)) {
      throw new Error('Invalid excludeIds parameter: must be an array');
    }

    // Build query using Knex query builder (prevents SQL injection)
    let query = db('cards')
      .where('is_boss', false)
      .orderByRaw('RANDOM()')
      .limit(safeCount);

    // Knex automatically sanitizes parameters in whereNotIn
    if (excludeIds.length > 0) {
      // Filter out invalid IDs (security hardening)
      const validIds = excludeIds.filter(id => {
        const parsed = parseInt(id, 10);
        return Number.isInteger(parsed) && parsed > 0;
      });

      if (validIds.length > 0) {
        query = query.whereNotIn('id', validIds);
      }
    }

    const cards = await query;

    // OPTIMIZED: Bulk load abilities instead of N+1 queries
    return await this.bulkAttachAbilities(cards);
  }
}

module.exports = new CardRepository();
