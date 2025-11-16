const db = require('../config/database');
const { NotFoundError } = require('../utils/errors');

class CardRepository {
  async getAllCards() {
    const cards = await db('cards')
      .select('*')
      .orderBy('rarity', 'desc')
      .orderBy('name', 'asc');

    return await Promise.all(cards.map(card => this.attachAbilities(card)));
  }

  async findById(id) {
    const card = await db('cards')
      .where({ id })
      .first();

    if (!card) {
      throw new NotFoundError(`Card with id ${id} not found`);
    }

    return await this.attachAbilities(card);
  }

  async findByIds(ids) {
    const cards = await db('cards')
      .whereIn('id', ids);

    return await Promise.all(cards.map(card => this.attachAbilities(card)));
  }

  async getCardsByRarity(rarity) {
    const cards = await db('cards')
      .where({ rarity })
      .select('*');

    return await Promise.all(cards.map(card => this.attachAbilities(card)));
  }

  async getRegularCards() {
    const cards = await db('cards')
      .where('is_boss', false)
      .select('*');

    return await Promise.all(cards.map(card => this.attachAbilities(card)));
  }

  async getBossCards() {
    const cards = await db('cards')
      .where('is_boss', true)
      .select('*');

    return await Promise.all(cards.map(card => this.attachAbilities(card)));
  }

  async attachAbilities(card) {
    const abilities = await db('card_abilities')
      .join('abilities', 'card_abilities.ability_id', 'abilities.id')
      .where('card_abilities.card_id', card.id)
      .select(
        'abilities.*',
        'card_abilities.ability_type'
      );

    return {
      ...card,
      abilities: abilities.reduce((acc, ability) => {
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
      }, {})
    };
  }

  async getRandomCards(count, excludeIds = []) {
    let query = db('cards')
      .where('is_boss', false)
      .orderByRaw('RANDOM()')
      .limit(count);

    if (excludeIds.length > 0) {
      query = query.whereNotIn('id', excludeIds);
    }

    const cards = await query;
    return await Promise.all(cards.map(card => this.attachAbilities(card)));
  }
}

module.exports = new CardRepository();
