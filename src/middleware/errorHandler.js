const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors || undefined
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
