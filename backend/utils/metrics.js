/**
 * Metrics Collection Utility
 * Collects and exposes application metrics for monitoring
 * @module utils/metrics
 */

const logger = require('./logger');

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byStatus: {},
        byRoute: {},
      },
      errors: {
        total: 0,
        byType: {},
        byRoute: {},
      },
      performance: {
        averageResponseTime: 0,
        slowRequests: 0,
        requestTimes: [],
      },
      database: {
        queries: 0,
        slowQueries: 0,
        errors: 0,
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
      },
      uptime: Date.now(),
    };

    // Keep only last 1000 request times for average calculation
    this.maxRequestTimes = 1000;
  }

  /**
   * Record a request
   */
  recordRequest(method, route, statusCode, duration) {
    this.metrics.requests.total++;
    
    // Track by method
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;
    
    // Track by status code
    const statusGroup = `${Math.floor(statusCode / 100)}xx`;
    this.metrics.requests.byStatus[statusGroup] = (this.metrics.requests.byStatus[statusGroup] || 0) + 1;
    
    // Track by route (normalize route)
    const normalizedRoute = this.normalizeRoute(route);
    this.metrics.requests.byRoute[normalizedRoute] = (this.metrics.requests.byRoute[normalizedRoute] || 0) + 1;
    
    // Track performance
    this.metrics.performance.requestTimes.push(duration);
    if (this.metrics.performance.requestTimes.length > this.maxRequestTimes) {
      this.metrics.performance.requestTimes.shift();
    }
    
    // Calculate average response time
    const sum = this.metrics.performance.requestTimes.reduce((a, b) => a + b, 0);
    this.metrics.performance.averageResponseTime = Math.round(sum / this.metrics.performance.requestTimes.length);
    
    // Track slow requests (>2s)
    if (duration > 2000) {
      this.metrics.performance.slowRequests++;
    }
  }

  /**
   * Record an error
   */
  recordError(errorType, route) {
    this.metrics.errors.total++;
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
    
    if (route) {
      const normalizedRoute = this.normalizeRoute(route);
      this.metrics.errors.byRoute[normalizedRoute] = (this.metrics.errors.byRoute[normalizedRoute] || 0) + 1;
    }
  }

  /**
   * Record database operation
   */
  recordDatabaseOperation(isSlow = false, isError = false) {
    this.metrics.database.queries++;
    if (isSlow) this.metrics.database.slowQueries++;
    if (isError) this.metrics.database.errors++;
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(isHit) {
    if (isHit) {
      this.metrics.cache.hits++;
    } else {
      this.metrics.cache.misses++;
    }
    
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.hitRate = total > 0 
      ? Math.round((this.metrics.cache.hits / total) * 100) 
      : 0;
  }

  /**
   * Normalize route for metrics (remove IDs, etc.)
   */
  normalizeRoute(route) {
    if (!route) return 'unknown';
    
    // Remove query strings
    route = route.split('?')[0];
    
    // Replace IDs with :id
    route = route.replace(/\/[a-f0-9]{24}/gi, '/:id');
    route = route.replace(/\/\d+/g, '/:id');
    
    return route;
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.metrics.uptime;
    
    return {
      ...this.metrics,
      uptime: {
        milliseconds: uptime,
        seconds: Math.floor(uptime / 1000),
        minutes: Math.floor(uptime / 60000),
        hours: Math.floor(uptime / 3600000),
        formatted: this.formatUptime(uptime),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get summary metrics
   */
  getSummary() {
    const metrics = this.getMetrics();
    
    return {
      requests: {
        total: metrics.requests.total,
        averageResponseTime: `${metrics.performance.averageResponseTime}ms`,
        slowRequests: metrics.performance.slowRequests,
      },
      errors: {
        total: metrics.errors.total,
        rate: metrics.requests.total > 0 
          ? `${Math.round((metrics.errors.total / metrics.requests.total) * 10000) / 100}%`
          : '0%',
      },
      database: {
        queries: metrics.database.queries,
        slowQueries: metrics.database.slowQueries,
        errors: metrics.database.errors,
      },
      cache: {
        hitRate: `${metrics.cache.hitRate}%`,
      },
      uptime: metrics.uptime.formatted,
    };
  }

  /**
   * Format uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byStatus: {},
        byRoute: {},
      },
      errors: {
        total: 0,
        byType: {},
        byRoute: {},
      },
      performance: {
        averageResponseTime: 0,
        slowRequests: 0,
        requestTimes: [],
      },
      database: {
        queries: 0,
        slowQueries: 0,
        errors: 0,
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
      },
      uptime: Date.now(),
    };
  }
}

// Singleton instance
const metricsCollector = new MetricsCollector();

module.exports = metricsCollector;

