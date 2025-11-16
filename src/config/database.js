const path = require('path');

const environment = process.env.NODE_ENV || 'development';

// Create knex configuration
const config = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, '../../database/dev.sqlite3'),
    },
    useNullAsDefault: true,
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
  },
};

const knex = require('knex')(config[environment]);

module.exports = knex;
