/**
 * Redis Configuration
 * Shared Redis client for caching and rate limiting
 * @module config/redis
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

/**
 * Parse Redis configuration from environment variables
 * Supports both REDIS_URL format and individual REDIS_HOST/PORT/PASSWORD
 */
const getRedisConfig = () => {
  // If REDIS_URL is provided, use it directly (common in cloud platforms like Render)
  if (process.env.REDIS_URL) {
    return {
      url: process.env.REDIS_URL,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true; // Reconnect on READONLY error
        }
        return false;
      },
    };
  }

  // Otherwise, use individual environment variables
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true; // Reconnect on READONLY error
      }
      return false;
    },
  };
};

// Redis configuration
const redisConfig = getRedisConfig();

let redisClient = null;

/**
 * Initialize Redis client
 * @returns {Redis} Redis client instance
 */
const initRedis = () => {
  if (redisClient) {
    return redisClient;
  }

  try {
    // Create Redis client - supports both URL and config object
    redisClient = redisConfig.url 
      ? new Redis(redisConfig.url, {
          maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
          enableOfflineQueue: redisConfig.enableOfflineQueue,
          retryStrategy: redisConfig.retryStrategy,
          reconnectOnError: redisConfig.reconnectOnError,
        })
      : new Redis(redisConfig);
    
    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      if (redisConfig.url) {
        // Extract host from URL for logging
        try {
          const url = new URL(redisConfig.url);
          logger.info(`✅ Redis client ready and connected to ${url.hostname}:${url.port || 6379}`);
        } catch {
          logger.info('✅ Redis client ready and connected');
        }
      } else {
        const host = redisConfig.host;
        const port = redisConfig.port;
        logger.info(`✅ Redis client ready and connected to ${host}:${port}`);
      }
    });

    redisClient.on('error', (err) => {
      let errorMsg = err.message;
      
      // Provide more helpful error messages for common issues
      if (err.message.includes('ECONNREFUSED')) {
        errorMsg = `Connection refused - Redis may not be running at ${redisConfig.host}:${redisConfig.port}. Check if Redis is started.`;
      } else if (err.message.includes('NOAUTH') || err.message.includes('authentication')) {
        errorMsg = 'Authentication failed - Check REDIS_PASSWORD environment variable.';
      } else if (err.message.includes('ETIMEDOUT') || err.message.includes('timeout')) {
        errorMsg = `Connection timeout - Cannot reach Redis at ${redisConfig.host}:${redisConfig.port}.`;
      }
      
      logger.warn(`Redis connection error: ${errorMsg}`);
      // Don't exit - allow graceful degradation
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    return redisClient;
  } catch (error) {
    logger.warn('Redis initialization failed:', error.message);
    logger.warn('Application will continue with in-memory fallback');
    return null;
  }
};

/**
 * Get Redis client instance
 * @returns {Redis|null} Redis client or null if not available
 */
const getRedisClient = () => {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
};

/**
 * Check if Redis is available
 * @returns {Promise<boolean>} True if Redis is available
 */
const isRedisAvailable = async () => {
  try {
    const client = getRedisClient();
    if (!client) {
      return false;
    }
    
    // Wait for client to be ready if it's still connecting
    if (client.status !== 'ready') {
      // Wait up to 2 seconds for connection
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Redis connection timeout'));
        }, 2000);
        
        if (client.status === 'ready') {
          clearTimeout(timeout);
          resolve();
        } else {
          client.once('ready', () => {
            clearTimeout(timeout);
            resolve();
          });
          
          client.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        }
      });
    }
    
    // Test with ping
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    return false;
  }
};

/**
 * Gracefully close Redis connection
 */
const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed gracefully');
    } catch (error) {
      logger.warn('Error closing Redis connection:', error.message);
    }
    redisClient = null;
  }
};

// Initialize on module load
initRedis();

module.exports = {
  getRedisClient,
  isRedisAvailable,
  closeRedis,
  redisConfig,
};

