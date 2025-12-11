const logger = require('../utils/logger');
const { captureException } = require('../utils/errorTracker');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error without sensitive payloads
  const safeLogMeta = {
    message: err.message,
    url: req.originalUrl,
    method: req.method,
    user: req.user?._id || 'unauthenticated',
    timestamp: new Date().toISOString(),
    bodyKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body) : undefined,
    queryKeys: req.query && typeof req.query === 'object' ? Object.keys(req.query) : undefined,
  };

  if (process.env.NODE_ENV === 'development') {
    safeLogMeta.stack = err.stack;
  }

  // Use structured logger instead of console.error
  logger.error('Error Details:', safeLogMeta);

  // Capture error in error tracking service (Sentry)
  if (error.statusCode >= 500 || !error.statusCode) {
    captureException(err, {
      user: req.user,
      tags: {
        url: req.originalUrl,
        method: req.method,
      },
      extra: safeLogMeta,
    });
  }

  // Respect custom statusCode if present
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Request failed',
      ...(err.meta && { data: err.meta }), // Include meta as data if present
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        error: err,
      }),
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      statusCode: 404,
      message,
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    
    // Extract field name from error
    const field = Object.keys(err.keyValue)[0];
    if (field === 'email') {
      message = 'Email address is already registered';
    }
    
    error = {
      statusCode: 400,
      message,
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(error => error.message).join(', ');
    error = {
      statusCode: 400,
      message,
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      statusCode: 401,
      message: 'Invalid token',
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      statusCode: 401,
      message: 'Token expired',
    };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      statusCode: 400,
      message: 'File size too large',
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      statusCode: 400,
      message: 'Unexpected file field',
    };
  }

  // OpenAI API errors
  if (err.status === 429 || err.type === 'insufficient_quota' || err.message?.includes('Too many requests')) {
    error = {
      statusCode: 429,
      message: 'AI service is experiencing high demand. Your request has been processed using our intelligent fallback system.',
    };
  }

  if (err.status === 403 || err.type === 'insufficient_quota') {
    error = {
      statusCode: 503,
      message: 'AI service quota exceeded. Your request has been processed using our intelligent fallback system.',
    };
  }

  if (err.type === 'invalid_request_error') {
    error = {
      statusCode: 400,
      message: 'Invalid request to AI service',
    };
  }

  // MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    error = {
      statusCode: 503,
      message: 'Database connection failed. Please try again later.',
    };
  }

  // Rate limit errors
  if (err.type === 'rate_limit_exceeded') {
    error = {
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err,
    }),
  });
};

/**
 * Middleware to handle 404 errors
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Async error handler wrapper
 * Wraps async functions to catch errors automatically
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validation error handler
 * Handles express-validator errors
 */
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
    });
  }
  
  next();
};

/**
 * Database error handler
 */
const handleDatabaseError = (err, req, res, next) => {
  if (err.name === 'MongoError' || err.name.startsWith('Mongo')) {
    logger.error('Database Error:', err);
    return res.status(503).json({
      success: false,
      message: 'Database service temporarily unavailable',
    });
  }
  next(err);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  handleValidationErrors,
  handleDatabaseError,
};
