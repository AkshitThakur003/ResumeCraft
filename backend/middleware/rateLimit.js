const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient, isRedisAvailable } = require('../config/redis');
const { asyncHandler } = require('./errorHandler');
const User = require('../models/User');
const logger = require('../utils/logger');

const DAILY_REANALYSIS_LIMIT = parseInt(process.env.REANALYSIS_DAILY_LIMIT || '5', 10);

// Check if rate limiting should be disabled (for testing)
const isRateLimitDisabled = () => {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.DISABLE_RATE_LIMIT === 'true' ||
    process.env.DISABLE_RATE_LIMIT === '1'
  );
};

/**
 * Persisted rate limiter for re-analysis requests (per user per UTC day)
 * Improved with atomic updates to prevent race conditions
 * Bypassed in test environments
 */
const reAnalysisRateLimit = asyncHandler(async (req, res, next) => {
  // Bypass rate limiting in test environments
  if (isRateLimitDisabled()) {
    return next();
  }

  const userId = req.user?._id?.toString();
  const clientIp = req.ip || req.connection.remoteAddress;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  
  // Use lean() for faster read-only query
  const user = await User.findById(userId).select('rateLimits').lean();

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User not found',
    });
  }

  // Get current count
  const currentCount = user.rateLimits?.reanalysis?.date === today 
    ? user.rateLimits.reanalysis.count || 0
    : 0;

  if (currentCount >= DAILY_REANALYSIS_LIMIT) {
    // Log potential abuse with IP
    logger.warn(`[Rate Limit] User ${userId} from IP ${clientIp} exceeded daily limit`);
    
    return res.status(429).json({
      success: false,
      message: 'Daily re-analysis limit exceeded. Please try again tomorrow.',
    });
  }

  // Atomic increment to prevent race conditions
  const updateResult = await User.findByIdAndUpdate(
    userId,
    {
      $set: { 
        'rateLimits.reanalysis.date': today 
      },
      $inc: { 
        'rateLimits.reanalysis.count': 1 
      }
    },
    { new: true, select: 'rateLimits' }
  );

  if (!updateResult) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update rate limit. Please try again.',
    });
  }

  // Set minimal rate limit headers (don't expose too much info)
  const remaining = Math.max(DAILY_REANALYSIS_LIMIT - (currentCount + 1), 0);
  res.set({
    'X-RateLimit-Remaining': String(remaining),
  });

  next();
});

/**
 * Redis store management - waits for Redis connection before creating store
 */
let cachedRedisStore = null;
let redisStoreInitialized = false;
let redisStoreInitPromise = null;

/**
 * Wait for Redis to be ready and create the store
 */
const waitForRedisAndCreateStore = () => {
  if (cachedRedisStore) {
    return Promise.resolve(cachedRedisStore);
  }

  if (redisStoreInitPromise) {
    return redisStoreInitPromise;
  }

  redisStoreInitPromise = new Promise((resolve) => {
    const redis = getRedisClient();
    
    if (!redis) {
      logger.warn('Redis client not available, rate limiters will use in-memory store.');
      resolve(undefined);
      return;
    }

    // Helper function to create store
    const createStore = () => {
      try {
        cachedRedisStore = new RedisStore({
          client: redis,
          prefix: 'rl:',
        });
        redisStoreInitialized = true;
        logger.info('✅ Redis store created for rate limiting');
        return cachedRedisStore;
      } catch (error) {
        logger.warn('Failed to create Redis store for rate limiting, using in-memory:', error.message);
        return undefined;
      }
    };

    // If Redis is already ready, create store immediately
    if (redis.status === 'ready') {
      const store = createStore();
      resolve(store);
      return;
    }

    // Wait for Redis to be ready
    logger.info('⏳ Waiting for Redis connection before initializing rate limiters...');
    if (redis.status === 'connecting' || redis.status === 'reconnecting') {
      logger.info(`   Redis status: ${redis.status}, waiting for 'ready' event...`);
    }
    
    const onReady = () => {
      const store = createStore();
      redis.removeListener('error', onError);
      redis.removeListener('connect', onConnect);
      clearTimeout(timeoutId);
      resolve(store);
    };

    const onError = (error) => {
      let errorMsg = error.message;
      if (error.message.includes('ECONNREFUSED')) {
        errorMsg = `Connection refused - Redis may not be running at ${redis.options?.host || 'localhost'}:${redis.options?.port || 6379}`;
      } else if (error.message.includes('NOAUTH') || error.message.includes('authentication')) {
        errorMsg = 'Authentication failed - Check REDIS_PASSWORD environment variable';
      }
      logger.warn(`Redis connection error, rate limiters will use in-memory store: ${errorMsg}`);
      redis.removeListener('ready', onReady);
      redis.removeListener('connect', onConnect);
      clearTimeout(timeoutId);
      resolve(undefined);
    };

    const onConnect = () => {
      logger.info(`Redis connecting to ${redis.options?.host || 'localhost'}:${redis.options?.port || 6379}...`);
    };

    redis.once('ready', onReady);
    redis.once('error', onError);
    redis.once('connect', onConnect);

    // If already connecting, we'll wait for it
    if (redis.status === 'connecting' || redis.status === 'reconnecting') {
      logger.info(`Redis is ${redis.status}, waiting for connection...`);
    }

    // Timeout after 30 seconds - fallback to in-memory (increased from 10s)
    const timeoutId = setTimeout(() => {
      if (!redisStoreInitialized) {
        logger.warn('Redis connection timeout (30s), rate limiters will use in-memory store.');
        logger.warn('   Make sure Redis is running and accessible.');
        redis.removeListener('ready', onReady);
        redis.removeListener('error', onError);
        redis.removeListener('connect', onConnect);
        resolve(undefined);
      }
    }, 30000);
  });

  return redisStoreInitPromise;
};

// Start waiting for Redis immediately (non-blocking)
waitForRedisAndCreateStore().catch(err => {
  logger.warn('Failed to initialize Redis store:', err.message);
});

/**
 * Rate limiters - will be created once Redis is ready
 */
let rateLimiters = null;
let rateLimitersInitialized = false;

/**
 * Initialize rate limiters with Redis store
 */
const initializeRateLimiters = async () => {
  if (rateLimitersInitialized && rateLimiters) {
    return rateLimiters;
  }

  // Wait for Redis store
  const store = await waitForRedisAndCreateStore();

  // Create all rate limiters with the store
  rateLimiters = {
    generalRateLimit: rateLimit({
      store: store,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false, // Count all requests
    }),

    authRateLimit: rateLimit({
      store: store,
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || (15 * 60 * 1000), 10),
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '20', 10),
      message: {
        success: false,
        message: 'Too many authentication attempts. Please wait and try again.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),

    coverLetterRateLimit: rateLimit({
      store: store,
      windowMs: parseInt(process.env.COVER_LETTER_RATE_LIMIT_WINDOW_MS || (60 * 60 * 1000), 10), // 1 hour
      max: parseInt(process.env.COVER_LETTER_RATE_LIMIT_MAX_REQUESTS || '20', 10), // 20 per hour
      message: {
        success: false,
        message: 'Too many cover letter generation requests. Please wait before generating another cover letter.',
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false, // Count all requests, even successful ones
    }),

    analysisRateLimit: rateLimit({
      store: store,
      windowMs: parseInt(process.env.ANALYSIS_RATE_LIMIT_WINDOW_MS || (60 * 60 * 1000), 10), // 1 hour
      max: parseInt(process.env.ANALYSIS_RATE_LIMIT_MAX_REQUESTS || '10', 10), // 10 per hour
      message: {
        success: false,
        message: 'Too many analysis requests. Please wait before analyzing again.',
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
    }),

    aiOperationRateLimit: rateLimit({
      store: store,
      windowMs: parseInt(process.env.AI_OPERATION_RATE_LIMIT_WINDOW_MS || (60 * 60 * 1000), 10), // 1 hour
      max: parseInt(process.env.AI_OPERATION_RATE_LIMIT_MAX_REQUESTS || '15', 10), // 15 AI operations per hour
      message: {
        success: false,
        message: 'Too many AI operations. Please wait before trying again.',
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
    }),

    adminGetRateLimit: rateLimit({
      store: store,
      windowMs: parseInt(process.env.ADMIN_GET_RATE_LIMIT_WINDOW_MS || (60 * 1000), 10), // 1 minute
      max: parseInt(process.env.ADMIN_GET_RATE_LIMIT_MAX_REQUESTS || '30', 10), // 30 requests per minute
      message: {
        success: false,
        message: 'Too many admin requests. Please wait before trying again.',
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
    }),
  };

  rateLimitersInitialized = true;
  logger.info('✅ Rate limiters initialized with Redis store');
  return rateLimiters;
};

// Start initializing rate limiters (non-blocking)
initializeRateLimiters().catch(err => {
  logger.warn('Failed to initialize rate limiters:', err.message);
});

/**
 * Create middleware wrappers that ensure rate limiters are initialized
 * Bypassed in test environments
 */
const createRateLimitMiddleware = (limiterName) => {
  return asyncHandler(async (req, res, next) => {
    // Bypass rate limiting in test environments
    if (isRateLimitDisabled()) {
      return next();
    }

    const limiters = await initializeRateLimiters();
    const limiter = limiters[limiterName];
    if (limiter) {
      return limiter(req, res, next);
    }
    // Fallback: allow request if limiter not ready (shouldn't happen)
    next();
  });
};

// Export rate limiters with lazy initialization
const generalRateLimit = createRateLimitMiddleware('generalRateLimit');
const authRateLimit = createRateLimitMiddleware('authRateLimit');
const coverLetterRateLimit = createRateLimitMiddleware('coverLetterRateLimit');
const analysisRateLimit = createRateLimitMiddleware('analysisRateLimit');
const aiOperationRateLimit = createRateLimitMiddleware('aiOperationRateLimit');
const adminGetRateLimit = createRateLimitMiddleware('adminGetRateLimit');

module.exports = {
  reAnalysisRateLimit,
  generalRateLimit,
  authRateLimit,
  coverLetterRateLimit,
  analysisRateLimit,
  aiOperationRateLimit,
  adminGetRateLimit,
};
