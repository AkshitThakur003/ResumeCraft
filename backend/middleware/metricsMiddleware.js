/**
 * Metrics Middleware
 * Records metrics for all requests
 * @module middleware/metricsMiddleware
 */

const metrics = require('../utils/metrics');

/**
 * Middleware to record request metrics
 */
const recordMetrics = (req, res, next) => {
  const startTime = Date.now();
  const route = req.originalUrl || req.url;

  // Record response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metrics.recordRequest(req.method, route, res.statusCode, duration);
    
    // Record errors
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
      metrics.recordError(errorType, route);
    }
  });

  next();
};

module.exports = {
  recordMetrics,
};

