const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration with validation
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Define allowed origins
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : [
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:5175',
          'http://localhost:3000'
        ];

    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600 // Cache preflight requests for 10 minutes
};

app.use(cors(corsOptions));

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Body parsing with size limits to prevent DoS attacks
app.use(express.json({
  limit: '100kb',  // Maximum payload size: 100KB
  strict: true,    // Only accept arrays and objects
  verify: (req, res, buf, encoding) => {
    // Additional validation can be added here
    if (buf.length > 100000) { // 100KB in bytes
      throw new Error('Request payload too large');
    }
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: '100kb',           // Maximum payload size: 100KB
  parameterLimit: 1000,     // Maximum number of parameters
  verify: (req, res, buf, encoding) => {
    if (buf.length > 100000) {
      throw new Error('Request payload too large');
    }
  }
}));

// Cookie parsing
app.use(cookieParser());

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
