/**
 * Migration: Create players and sessions tables
 * Purpose: Guest authentication and session management
 */

exports.up = async function (knex) {
  const isPostgres = knex.client.config.client === 'postgresql';

  // Create players table
  await knex.schema.createTable('players', (table) => {
    if (isPostgres) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    } else {
      table.increments('id').primary();
    }
    table.string('guest_id', 255).notNullable().unique();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('last_seen_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('created_at', 'idx_players_created_at');
  });

  // Create sessions table
  await knex.schema.createTable('sessions', (table) => {
    if (isPostgres) {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('player_id').notNullable();
    } else {
      table.increments('id').primary();
      table.integer('player_id').notNullable();
    }
    table.string('token', 512).notNullable().unique();
    table.timestamp('expires_at').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Foreign keys
    table
      .foreign('player_id')
      .references('id')
      .inTable('players')
      .onDelete('CASCADE');

    // Indexes
    table.index('player_id', 'idx_sessions_player_id');
    table.index('expires_at', 'idx_sessions_expires_at');
  });

  // Create trigger for updating last_seen_at (PostgreSQL only)
  if (knex.client.config.client === 'postgresql') {
    await knex.raw(`
      CREATE OR REPLACE FUNCTION update_player_last_seen()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE players SET last_seen_at = NOW() WHERE id = NEW.player_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER update_last_seen_on_session
        AFTER INSERT ON sessions
        FOR EACH ROW
        EXECUTE FUNCTION update_player_last_seen();
    `);
  }
};

exports.down = async function (knex) {
  // Drop trigger (PostgreSQL only)
  if (knex.client.config.client === 'postgresql') {
    await knex.raw('DROP TRIGGER IF EXISTS update_last_seen_on_session ON sessions');
    await knex.raw('DROP FUNCTION IF EXISTS update_player_last_seen()');
  }

  // Drop tables
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('players');
};
