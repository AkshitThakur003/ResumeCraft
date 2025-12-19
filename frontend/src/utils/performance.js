/**
 * Performance monitoring utilities
 * Tracks Web Vitals and performance metrics
 */

import { logger } from './logger';

/**
 * Report Web Vitals to analytics service
 * @param {Object} metric - Web Vital metric
 */
export const reportWebVital = (metric) => {
  // Log using logger in development
  if (import.meta.env.DEV) {
    logger.info('Web Vital:', metric);
  }

  // Send to analytics service (e.g., Google Analytics, Sentry)
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Send to Sentry if available
  if (window.Sentry) {
    window.Sentry.metrics.distribution('web_vitals', metric.value, {
      tags: {
        metric_name: metric.name,
        metric_id: metric.id,
      },
    });
  }
};

/**
 * Measure performance of a function
 * @param {Function} fn - Function to measure
 * @param {string} name - Name for the measurement
 * @returns {Promise<any>} - Result of the function
 */
export const measurePerformance = async (fn, name) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;

  if (import.meta.env.DEV) {
    logger.debug(`Performance [${name}]: ${duration.toFixed(2)}ms`);
  }

  // Report to analytics if duration is significant
  if (duration > 100 && window.gtag) {
    window.gtag('event', 'performance_measurement', {
      event_category: 'Performance',
      event_label: name,
      value: Math.round(duration),
    });
  }

  return result;
};

/**
 * Initialize Web Vitals tracking
 */
export const initWebVitals = () => {
  // Only track in production or if explicitly enabled
  if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_WEB_VITALS === 'true') {
    // Dynamically import web-vitals library
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(reportWebVital);
      onFID(reportWebVital);
      onFCP(reportWebVital);
      onLCP(reportWebVital);
      onTTFB(reportWebVital);
      onINP(reportWebVital);
    }).catch((error) => {
      logger.warn('Failed to load web-vitals:', error);
    });
  }
};

/**
 * Get performance timing information
 * @returns {Object} Performance timing data
 */
export const getPerformanceTiming = () => {
  if (!window.performance || !window.performance.timing) {
    return null;
  }

  const timing = window.performance.timing;
  const navigation = window.performance.navigation;

  return {
    // DNS lookup time
    dns: timing.domainLookupEnd - timing.domainLookupStart,
    // TCP connection time
    tcp: timing.connectEnd - timing.connectStart,
    // Request time
    request: timing.responseStart - timing.requestStart,
    // Response time
    response: timing.responseEnd - timing.responseStart,
    // DOM processing time
    domProcessing: timing.domComplete - timing.domLoading,
    // Page load time
    pageLoad: timing.loadEventEnd - timing.navigationStart,
    // Navigation type
    navigationType: navigation.type,
  };
};

/**
 * Monitor long tasks (tasks that block the main thread for >50ms)
 */
export const initLongTaskMonitoring = () => {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            logger.warn('Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
            });

            // Report to analytics
            if (window.gtag) {
              window.gtag('event', 'long_task', {
                event_category: 'Performance',
                value: Math.round(entry.duration),
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Long task monitoring not supported
      logger.debug('Long task monitoring not supported');
    }
  }
};

