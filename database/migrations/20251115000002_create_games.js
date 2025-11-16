/**
 * Migration: Create games table
 * Purpose: Core game state and session tracking
 */

exports.up = async function (knex) {
  const isPostgres = knex.client.config.client === 'postgresql';

  await knex.schema.createTable('games', (table) => {
    if (isPostgres) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('player_id').notNullable();
    } else {
      table.increments('id').primary();
      table.integer('player_id').notNullable();
    }
    table.string('status', 20).notNullable().defaultTo('active');
    table.integer('current_turn').notNullable().defaultTo(0);
    table.string('phase', 20).notNullable().defaultTo('tavern');
    table.integer('player_current_hp').notNullable().defaultTo(0);
    table.integer('player_max_hp').notNullable().defaultTo(0);
    table.boolean('boss_defeated').notNullable().defaultTo(false);
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Foreign keys
    table
      .foreign('player_id')
      .references('id')
      .inTable('players')
      .onDelete('CASCADE');

    // Indexes
    table.index(['player_id', 'status'], 'idx_games_player_id_status');
    table.index('updated_at', 'idx_games_updated_at');

    // Check constraints
    if (knex.client.config.client === 'postgresql') {
      table.check("status IN ('active', 'completed', 'abandoned')", [], 'games_status_check');
      table.check(
        "phase IN ('tavern', 'combat', 'management', 'victory', 'defeat')",
        [],
        'games_phase_check'
      );
      table.check('current_turn >= 0', [], 'games_current_turn_check');
      table.check('player_current_hp >= 0', [], 'games_player_current_hp_check');
      table.check('player_max_hp >= 0', [], 'games_player_max_hp_check');
    }
  });

  // Create trigger for updating updated_at (PostgreSQL only)
  if (knex.client.config.client === 'postgresql') {
    await knex.raw(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER update_games_updated_at
        BEFORE UPDATE ON games
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
  }
};

exports.down = async function (knex) {
  // Drop trigger (PostgreSQL only)
  if (knex.client.config.client === 'postgresql') {
    await knex.raw('DROP TRIGGER IF EXISTS update_games_updated_at ON games');
    await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column()');
  }

  await knex.schema.dropTableIfExists('games');
};
