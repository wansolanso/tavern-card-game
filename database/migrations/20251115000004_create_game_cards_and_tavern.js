/**
 * Migration: Create game_cards and tavern_cards tables
 * Purpose: Player inventory and tavern card pool
 */

exports.up = async function (knex) {
  const isPostgres = knex.client.config.client === 'postgresql';

  // Create game_cards table (player inventory)
  await knex.schema.createTable('game_cards', (table) => {
    if (isPostgres) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('game_id').notNullable();
    } else {
      table.increments('id').primary();
      table.integer('game_id').notNullable();
    }
    table.string('card_id', 50).notNullable();
    table.string('location', 20).notNullable();
    table.string('slot_type', 20).nullable();
    table.integer('slot_position').nullable();
    table.timestamp('acquired_at').notNullable().defaultTo(knex.fn.now());

    // Foreign keys
    table
      .foreign('game_id')
      .references('id')
      .inTable('games')
      .onDelete('CASCADE');
    table
      .foreign('card_id')
      .references('id')
      .inTable('cards')
      .onDelete('RESTRICT');

    // Indexes
    table.index('game_id', 'idx_game_cards_game_id');

    // Check constraints (PostgreSQL only)
    if (knex.client.config.client === 'postgresql') {
      table.check("location IN ('reserve', 'equipped')", [], 'game_cards_location_check');
      table.check(
        "slot_type IN ('hp', 'shield', 'special', 'passive', 'normal') OR slot_type IS NULL",
        [],
        'game_cards_slot_type_check'
      );
      table.check(
        'slot_position IN (0, 1) OR slot_position IS NULL',
        [],
        'game_cards_slot_position_check'
      );
      table.check(
        `(location = 'equipped' AND slot_type IS NOT NULL AND slot_position IS NOT NULL) OR
         (location = 'reserve' AND slot_type IS NULL AND slot_position IS NULL)`,
        [],
        'game_cards_slot_consistency_check'
      );
    }
  });

  // Create unique partial index for equipped slots (PostgreSQL)
  if (knex.client.config.client === 'postgresql') {
    await knex.raw(`
      CREATE UNIQUE INDEX idx_game_cards_slot_unique
      ON game_cards(game_id, slot_type, slot_position)
      WHERE location = 'equipped'
    `);
  }

  // Create tavern_cards table
  await knex.schema.createTable('tavern_cards', (table) => {
    if (isPostgres) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('game_id').notNullable();
    } else {
      table.increments('id').primary();
      table.integer('game_id').notNullable();
    }
    table.string('card_id', 50).notNullable();
    table.integer('position').notNullable();
    table.integer('current_hp').notNullable();
    table.integer('current_shield').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Foreign keys
    table
      .foreign('game_id')
      .references('id')
      .inTable('games')
      .onDelete('CASCADE');
    table
      .foreign('card_id')
      .references('id')
      .inTable('cards')
      .onDelete('RESTRICT');

    // Indexes
    table.unique(['game_id', 'position'], 'idx_tavern_cards_game_position');
    table.index('game_id', 'idx_tavern_cards_game_id');

    // Check constraints (PostgreSQL only)
    if (knex.client.config.client === 'postgresql') {
      table.check('position >= 0 AND position <= 8', [], 'tavern_cards_position_check');
      table.check('current_hp >= 0', [], 'tavern_cards_current_hp_check');
      table.check('current_shield >= 0', [], 'tavern_cards_current_shield_check');
    }
  });

  // Create slot_upgrades table
  await knex.schema.createTable('slot_upgrades', (table) => {
    if (isPostgres) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('game_id').notNullable();
    } else {
      table.increments('id').primary();
      table.integer('game_id').notNullable();
    }
    table.string('slot_type', 20).notNullable();
    table.integer('capacity').notNullable().defaultTo(1);
    table.timestamp('upgraded_at').notNullable().defaultTo(knex.fn.now());

    // Foreign keys
    table
      .foreign('game_id')
      .references('id')
      .inTable('games')
      .onDelete('CASCADE');

    // Indexes
    table.unique(['game_id', 'slot_type'], 'idx_slot_upgrades_game_slot');

    // Check constraints (PostgreSQL only)
    if (knex.client.config.client === 'postgresql') {
      table.check(
        "slot_type IN ('hp', 'shield', 'special', 'passive', 'normal')",
        [],
        'slot_upgrades_slot_type_check'
      );
    }
  });

  // Create trigger to auto-calculate player HP when cards change (PostgreSQL only)
  if (knex.client.config.client === 'postgresql') {
    await knex.raw(`
      CREATE OR REPLACE FUNCTION recalculate_player_hp()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE games g
        SET
          player_max_hp = (
            SELECT COALESCE(SUM(c.hp), 0)
            FROM game_cards gc
            JOIN cards c ON gc.card_id = c.id
            WHERE gc.game_id = COALESCE(NEW.game_id, OLD.game_id)
              AND gc.location = 'equipped'
              AND gc.slot_type = 'hp'
          ),
          player_current_hp = LEAST(
            player_current_hp,
            (SELECT COALESCE(SUM(c.hp), 0)
             FROM game_cards gc
             JOIN cards c ON gc.card_id = c.id
             WHERE gc.game_id = COALESCE(NEW.game_id, OLD.game_id)
               AND gc.location = 'equipped'
               AND gc.slot_type = 'hp')
          )
        WHERE g.id = COALESCE(NEW.game_id, OLD.game_id);

        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER recalculate_hp_on_card_change
        AFTER INSERT OR UPDATE OR DELETE ON game_cards
        FOR EACH ROW
        WHEN (
          (TG_OP = 'INSERT' AND NEW.slot_type = 'hp') OR
          (TG_OP = 'UPDATE' AND (NEW.slot_type = 'hp' OR OLD.slot_type = 'hp')) OR
          (TG_OP = 'DELETE' AND OLD.slot_type = 'hp')
        )
        EXECUTE FUNCTION recalculate_player_hp();
    `);
  }
};

exports.down = async function (knex) {
  // Drop trigger (PostgreSQL only)
  if (knex.client.config.client === 'postgresql') {
    await knex.raw('DROP TRIGGER IF EXISTS recalculate_hp_on_card_change ON game_cards');
    await knex.raw('DROP FUNCTION IF EXISTS recalculate_player_hp()');
  }

  await knex.schema.dropTableIfExists('slot_upgrades');
  await knex.schema.dropTableIfExists('tavern_cards');
  await knex.schema.dropTableIfExists('game_cards');
};
