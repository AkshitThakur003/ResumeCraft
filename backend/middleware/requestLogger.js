/**
 * Request/Response Logging Middleware
 * Logs all incoming requests and outgoing responses with relevant metadata
 * @module middleware/requestLogger
 */

const logger = require('../utils/logger');

/**
 * Middleware to log incoming requests
 * Logs method, URL, IP, user agent, and request body (sanitized)
 */
const logRequest = (req, res, next) => {
  // Skip logging for health checks and static assets
  if (req.path === '/health' || req.path.startsWith('/api-docs')) {
    return next();
  }

  const startTime = Date.now();
  req._startTime = startTime;

  // Sanitize request body for logging (remove sensitive data)
  const sanitizedBody = sanitizeRequestBody(req.body);

  const requestLog = {
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?._id || 'anonymous',
    body: sanitizedBody,
    query: req.query,
    timestamp: new Date().toISOString(),
  };

  logger.http('Incoming Request', requestLog);

  // Log response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const responseLog = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?._id || 'anonymous',
      timestamp: new Date().toISOString(),
    };

    // Log at different levels based on status code
    if (res.statusCode >= 500) {
      logger.error('Request Error', responseLog);
    } else if (res.statusCode >= 400) {
      logger.warn('Request Warning', responseLog);
    } else {
      logger.http('Request Completed', responseLog);
    }
  });

  next();
};

/**
 * Sanitize request body to remove sensitive information
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'token', 'accessToken', 'refreshToken', 'apiKey', 'secret'];
  const sanitized = { ...body };

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  // Limit body size for logging
  const bodyString = JSON.stringify(sanitized);
  if (bodyString.length > 1000) {
    return { ...sanitized, _truncated: true, _originalSize: bodyString.length };
  }

  return sanitized;
};

/**
 * Middleware to log slow requests
 * Logs requests that take longer than the threshold
 */
const logSlowRequests = (thresholdMs = 1000) => {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      if (duration > thresholdMs) {
        logger.warn('Slow Request Detected', {
          method: req.method,
          url: req.originalUrl || req.url,
          path: req.path,
          duration: `${duration}ms`,
          threshold: `${thresholdMs}ms`,
          userId: req.user?._id || 'anonymous',
          query: Object.keys(req.query).length > 0 ? Object.keys(req.query) : undefined,
        });
      }
    });

    next();
  };
};

module.exports = {
  logRequest,
  logSlowRequests,
};

