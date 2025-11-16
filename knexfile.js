const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, 'database', 'dev.sqlite3'),
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
      },
    },
    migrations: {
      directory: path.join(__dirname, 'database', 'migrations'),
    },
    seeds: {
      directory: path.join(__dirname, 'database', 'seeds'),
    },
  },
};
