/**
 * Migration: Create cards, abilities, and card_abilities tables
 * Purpose: Card catalog and ability system
 */

exports.up = async function (knex) {
  // Create cards table
  await knex.schema.createTable('cards', (table) => {
    table.string('id', 50).primary();
    table.string('name', 100).notNullable();
    table.text('description').nullable();
    table.integer('hp').notNullable();
    table.integer('shield').notNullable().defaultTo(0);
    table.string('rarity', 20).notNullable().defaultTo('common');
    table.boolean('is_boss').notNullable().defaultTo(false);
    table.string('image_url', 255).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('rarity', 'idx_cards_rarity');
    table.index('is_boss', 'idx_cards_is_boss');

    // Check constraints (PostgreSQL only)
    if (knex.client.config.client === 'postgresql') {
      table.check(
        "rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')",
        [],
        'cards_rarity_check'
      );
      table.check('hp > 0', [], 'cards_hp_check');
      table.check('shield >= 0', [], 'cards_shield_check');
    }
  });

  // Create abilities table
  await knex.schema.createTable('abilities', (table) => {
    table.string('id', 50).primary();
    table.string('name', 100).notNullable();
    table.text('description').notNullable();
    table.string('type', 20).notNullable();
    table.integer('power').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // JSONB for PostgreSQL, JSON for SQLite
    if (knex.client.config.client === 'postgresql') {
      table.jsonb('effects').nullable();
    } else {
      table.json('effects').nullable();
    }

    // Indexes
    table.index('type', 'idx_abilities_type');

    // Check constraints (PostgreSQL only)
    if (knex.client.config.client === 'postgresql') {
      table.check(
        "type IN ('damage', 'heal', 'shield', 'buff', 'debuff', 'special')",
        [],
        'abilities_type_check'
      );
      table.check('power >= 0', [], 'abilities_power_check');
    }
  });

  // Create GIN index on effects (PostgreSQL only)
  if (knex.client.config.client === 'postgresql') {
    await knex.raw('CREATE INDEX idx_abilities_effects ON abilities USING GIN (effects)');
  }

  // Create card_abilities junction table
  await knex.schema.createTable('card_abilities', (table) => {
    if (knex.client.config.client === 'postgresql') {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    } else {
      table.increments('id').primary();
    }
    table.string('card_id', 50).notNullable();
    table.string('ability_id', 50).notNullable();
    table.string('ability_type', 20).notNullable();

    // Foreign keys
    table
      .foreign('card_id')
      .references('id')
      .inTable('cards')
      .onDelete('CASCADE');
    table
      .foreign('ability_id')
      .references('id')
      .inTable('abilities')
      .onDelete('CASCADE');

    // Indexes
    table.unique(['card_id', 'ability_type'], 'idx_card_abilities_card_type');
    table.index('ability_id', 'idx_card_abilities_ability_id');

    // Check constraints (PostgreSQL only)
    if (knex.client.config.client === 'postgresql') {
      table.check(
        "ability_type IN ('special', 'passive', 'normal')",
        [],
        'card_abilities_type_check'
      );
    }
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('card_abilities');
  await knex.schema.dropTableIfExists('abilities');
  await knex.schema.dropTableIfExists('cards');
};
