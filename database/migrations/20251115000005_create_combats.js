/**
 * Migration: Create combats and combat_events tables
 * Purpose: Combat session tracking and event logging
 */

exports.up = async function (knex) {
  const isPostgres = knex.client.config.client === 'postgresql';

  // Create combats table
  await knex.schema.createTable('combats', (table) => {
    if (isPostgres) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('game_id').notNullable();
    } else {
      table.increments('id').primary();
      table.integer('game_id').notNullable();
    }
    table.string('target_card_id', 50).notNullable();
    table.integer('target_current_hp').notNullable();
    table.integer('target_current_shield').notNullable();
    table.integer('turn').notNullable().defaultTo(1);
    table.string('status', 20).notNullable().defaultTo('active');
    table.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('ended_at').nullable();

    // JSONB for PostgreSQL, JSON for SQLite
    if (knex.client.config.client === 'postgresql') {
      table.jsonb('player_stats').notNullable();
    } else {
      table.json('player_stats').notNullable();
    }

    // Foreign keys
    table
      .foreign('game_id')
      .references('id')
      .inTable('games')
      .onDelete('CASCADE');
    table
      .foreign('target_card_id')
      .references('id')
      .inTable('cards')
      .onDelete('RESTRICT');

    // Indexes
    table.index(['game_id', 'status'], 'idx_combats_game_id_status');

    // Check constraints (PostgreSQL only)
    if (knex.client.config.client === 'postgresql') {
      table.check("status IN ('active', 'victory', 'defeat')", [], 'combats_status_check');
      table.check('target_current_hp >= 0', [], 'combats_target_current_hp_check');
      table.check('target_current_shield >= 0', [], 'combats_target_current_shield_check');
      table.check('turn > 0', [], 'combats_turn_check');
    }
  });

  // Create GIN index on player_stats (PostgreSQL only)
  if (knex.client.config.client === 'postgresql') {
    await knex.raw('CREATE INDEX idx_combats_player_stats ON combats USING GIN (player_stats)');
  }

  // Create combat_events table
  await knex.schema.createTable('combat_events', (table) => {
    if (isPostgres) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('combat_id').notNullable();
    } else {
      table.increments('id').primary();
      table.integer('combat_id').notNullable();
    }
    table.integer('turn').notNullable();
    table.string('actor', 20).notNullable();
    table.string('action', 50).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // JSONB for PostgreSQL, JSON for SQLite
    if (knex.client.config.client === 'postgresql') {
      table.jsonb('result').notNullable();
    } else {
      table.json('result').notNullable();
    }

    // Foreign keys
    table
      .foreign('combat_id')
      .references('id')
      .inTable('combats')
      .onDelete('CASCADE');

    // Indexes
    table.index(['combat_id', 'turn'], 'idx_combat_events_combat_id_turn');

    // Check constraints (PostgreSQL only)
    if (knex.client.config.client === 'postgresql') {
      table.check("actor IN ('player', 'enemy')", [], 'combat_events_actor_check');
      table.check('turn > 0', [], 'combat_events_turn_check');
    }
  });

  // Create GIN index on result (PostgreSQL only)
  if (knex.client.config.client === 'postgresql') {
    await knex.raw(
      'CREATE INDEX idx_combat_events_result ON combat_events USING GIN (result)'
    );
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('combat_events');
  await knex.schema.dropTableIfExists('combats');
};
