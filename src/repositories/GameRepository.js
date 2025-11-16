const db = require('../config/database');
const { NotFoundError, ConflictError } = require('../utils/errors');

class GameRepository {
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

  async update(gameId, updates) {
    await db('games')
      .where({ id: gameId })
      .update({
        ...updates,
        updated_at: new Date()
      });

    return this.findById(gameId);
  }

  async loadGameState(game) {
    const [hand, equipped, tavern, slotUpgrades] = await Promise.all([
      this.getHandCards(game.id),
      this.getEquippedCards(game.id),
      this.getTavernCards(game.id),
      this.getSlotUpgrades(game.id)
    ]);

    return {
      ...game,
      hand,
      equipped,
      tavern,
      slot_upgrades: slotUpgrades
    };
  }

  async getHandCards(gameId) {
    return await db('game_cards')
      .join('cards', 'game_cards.card_id', 'cards.id')
      .where('game_cards.game_id', gameId)
      .where('game_cards.location', 'hand')
      .select('cards.*');
  }

  async getEquippedCards(gameId) {
    const equipped = await db('game_cards')
      .join('cards', 'game_cards.card_id', 'cards.id')
      .where('game_cards.game_id', gameId)
      .where('game_cards.location', 'equipped')
      .select(
        'cards.*',
        'game_cards.slot_type'
      );

    return equipped.reduce((acc, card) => {
      const slot = card.slot_type;
      if (!acc[slot]) {
        acc[slot] = [];
      }
      acc[slot].push(card);
      return acc;
    }, {});
  }

  async getTavernCards(gameId) {
    return await db('tavern_cards')
      .join('cards', 'tavern_cards.card_id', 'cards.id')
      .where('tavern_cards.game_id', gameId)
      .select('cards.*', 'tavern_cards.position', 'tavern_cards.current_hp', 'tavern_cards.current_shield')
      .orderBy('tavern_cards.position', 'asc');
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
