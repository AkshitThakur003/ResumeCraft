/**
 * Logger utility for development and production
 * Automatically disables logging in production builds
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'

/**
 * Logger object with different log levels
 * In production, all logs are no-ops to prevent console output
 */
export const logger = {
  /**
   * Log informational messages
   * @param {...any} args - Arguments to log
   */
  log: isDevelopment ? (...args) => console.log('[LOG]', ...args) : () => {},

  /**
   * Log error messages
   * In production, errors can be sent to error tracking service
   * @param {...any} args - Arguments to log
   */
  error: isDevelopment 
    ? (...args) => console.error('[ERROR]', ...args)
    : (...args) => {
        // In production, you could send to error tracking service
        // Example: Sentry.captureException(args[0])
      },

  /**
   * Log warning messages
   * @param {...any} args - Arguments to log
   */
  warn: isDevelopment ? (...args) => console.warn('[WARN]', ...args) : () => {},

  /**
   * Log debug messages (only in development)
   * @param {...any} args - Arguments to log
   */
  debug: isDevelopment ? (...args) => console.debug('[DEBUG]', ...args) : () => {},

  /**
   * Log info messages
   * @param {...any} args - Arguments to log
   */
  info: isDevelopment ? (...args) => console.info('[INFO]', ...args) : () => {},

  /**
   * Group related log messages
   * @param {string} label - Group label
   * @param {Function} fn - Function containing grouped logs
   */
  group: isDevelopment 
    ? (label, fn) => {
        console.group(label)
        fn()
        console.groupEnd()
      }
    : () => {},

  /**
   * Log table data
   * @param {any} data - Data to display as table
   */
  table: isDevelopment ? (data) => console.table(data) : () => {},
}

/**
 * Create a scoped logger with a prefix
 * @param {string} prefix - Prefix for all log messages
 * @returns {Object} Scoped logger instance
 */
export const createLogger = (prefix) => ({
  log: (...args) => logger.log(`[${prefix}]`, ...args),
  error: (...args) => logger.error(`[${prefix}]`, ...args),
  warn: (...args) => logger.warn(`[${prefix}]`, ...args),
  debug: (...args) => logger.debug(`[${prefix}]`, ...args),
  info: (...args) => logger.info(`[${prefix}]`, ...args),
  group: (label, fn) => logger.group(`[${prefix}] ${label}`, fn),
  table: logger.table,
})

export default logger

