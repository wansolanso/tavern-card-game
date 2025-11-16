// Knex.js configuration for Tavern Card Game
// Supports both SQLite (development) and PostgreSQL (production)

require('dotenv').config();

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3',
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
    pool: {
      afterCreate: (conn, cb) => {
        // Enable foreign keys in SQLite
        conn.run('PRAGMA foreign_keys = ON', cb);
      },
    },
  },

  test: {
    client: 'sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
      },
    },
  },

  production: {
    client: 'postgresql',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};
