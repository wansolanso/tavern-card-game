const path = require('path');
const logger = require('../utils/logger');

const environment = process.env.NODE_ENV || 'development';

// Query performance monitoring (enabled via environment variable)
const ENABLE_QUERY_LOGGING = process.env.ENABLE_QUERY_LOGGING === 'true';
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD || '100', 10);

// Request-scoped query counter (for N+1 detection)
const queryCounters = new Map();

/**
 * Get or create query counter for current request
 * Used to detect N+1 query patterns in development
 */
function getQueryCounter(requestId = 'global') {
  if (!queryCounters.has(requestId)) {
    queryCounters.set(requestId, { count: 0, queries: [] });
  }
  return queryCounters.get(requestId);
}

/**
 * Reset query counter for a request
 */
function resetQueryCounter(requestId = 'global') {
  queryCounters.delete(requestId);
}

/**
 * Get query statistics for a request
 */
function getQueryStats(requestId = 'global') {
  const counter = queryCounters.get(requestId);
  if (!counter) {
    return { count: 0, queries: [], totalTime: 0 };
  }

  const totalTime = counter.queries.reduce((sum, q) => sum + (q.duration || 0), 0);
  return {
    count: counter.count,
    queries: counter.queries,
    totalTime,
    avgTime: counter.count > 0 ? totalTime / counter.count : 0
  };
}

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
    // Enable debug logging if query logging is enabled
    debug: ENABLE_QUERY_LOGGING,
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

// Query performance monitoring
if (ENABLE_QUERY_LOGGING) {
  knex.on('query', (queryData) => {
    queryData.__startTime = Date.now();
  });

  knex.on('query-response', (response, queryData) => {
    const duration = Date.now() - queryData.__startTime;
    const counter = getQueryCounter();

    counter.count++;
    counter.queries.push({
      sql: queryData.sql,
      bindings: queryData.bindings,
      duration,
      timestamp: new Date()
    });

    // Log slow queries
    if (duration > SLOW_QUERY_THRESHOLD) {
      logger.warn('Slow query detected', {
        duration: `${duration}ms`,
        sql: queryData.sql,
        bindings: queryData.bindings
      });
    }

    // Log all queries in development
    if (environment === 'development') {
      logger.debug(`Query #${counter.count}`, {
        duration: `${duration}ms`,
        sql: queryData.sql.substring(0, 100) + (queryData.sql.length > 100 ? '...' : '')
      });
    }
  });

  knex.on('query-error', (error, queryData) => {
    const duration = Date.now() - queryData.__startTime;
    logger.error('Query error', {
      duration: `${duration}ms`,
      error: error.message,
      sql: queryData.sql,
      bindings: queryData.bindings
    });
  });
}

// Export both knex instance and query monitoring utilities
module.exports = knex;
module.exports.getQueryCounter = getQueryCounter;
module.exports.resetQueryCounter = resetQueryCounter;
module.exports.getQueryStats = getQueryStats;
