/**
 * Query Performance Logging Middleware
 *
 * Tracks database query count and performance per HTTP request.
 * Helps detect N+1 query patterns and performance regressions.
 *
 * Usage:
 *   Enable via environment variable: ENABLE_QUERY_LOGGING=true
 *
 * Features:
 *   - Per-request query counting
 *   - Total query time tracking
 *   - N+1 pattern detection (warns if >10 queries per request)
 *   - Response header with query metrics
 */

const { getQueryStats, resetQueryCounter } = require('../config/database');
const logger = require('../utils/logger');

// N+1 detection threshold
const N_PLUS_ONE_THRESHOLD = 10;
const SLOW_REQUEST_THRESHOLD = 500; // ms

/**
 * Middleware to track query performance per request
 */
function queryLogger(req, res, next) {
  const requestId = req.id || `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  req.queryRequestId = requestId;

  const requestStart = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override end to capture query stats
  res.end = function (...args) {
    const requestDuration = Date.now() - requestStart;
    const queryStats = getQueryStats(requestId);

    // Add query metrics to response headers (for debugging)
    res.setHeader('X-Query-Count', queryStats.count);
    res.setHeader('X-Query-Time', `${queryStats.totalTime}ms`);
    res.setHeader('X-Request-Time', `${requestDuration}ms`);

    // Log query performance
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      requestDuration: `${requestDuration}ms`,
      queryCount: queryStats.count,
      queryTime: `${queryStats.totalTime}ms`,
      avgQueryTime: `${queryStats.avgTime.toFixed(2)}ms`
    };

    // Detect potential N+1 patterns
    if (queryStats.count > N_PLUS_ONE_THRESHOLD) {
      logger.warn('Potential N+1 query pattern detected', {
        ...logData,
        threshold: N_PLUS_ONE_THRESHOLD,
        message: `Request made ${queryStats.count} queries (threshold: ${N_PLUS_ONE_THRESHOLD})`
      });
    }

    // Log slow requests
    if (requestDuration > SLOW_REQUEST_THRESHOLD) {
      logger.warn('Slow request detected', {
        ...logData,
        threshold: `${SLOW_REQUEST_THRESHOLD}ms`
      });
    }

    // Log all requests in development
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_QUERY_LOGGING === 'true') {
      logger.info('Request completed', logData);
    }

    // Clean up query counter for this request
    resetQueryCounter(requestId);

    // Call original end
    return originalEnd.apply(res, args);
  };

  next();
}

module.exports = queryLogger;
