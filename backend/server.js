require('dotenv').config();

// Initialize logger early
const logger = require('./utils/logger');

// Initialize error tracking early (before other imports)
// This allows error tracking to capture errors from the start
try {
  require('./utils/errorTracker');
} catch (error) {
  // Error tracking is optional, continue if it fails
  logger.warn('Error tracking initialization failed:', error.message);
}

// Validate required environment variables
const requiredEnvVars = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI',
];

const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
  logger.error('❌ Missing required environment variables:');
  missingVars.forEach(envVar => {
    logger.error(`   - ${envVar}`);
  });
  logger.error('\nPlease set these variables in your .env file before starting the server.');
  process.exit(1);
}

/**
 * Validate JWT Secret Strength
 * 
 * Ensures JWT secrets meet minimum security requirements for production use.
 * This prevents common security mistakes like using weak or guessable secrets.
 * 
 * Security checks performed:
 * 1. Minimum length (32 chars) - Ensures sufficient key space
 * 2. Entropy check (16 unique chars) - Prevents repetitive patterns like "aaaa..."
 * 3. Weak pattern detection - Catches common mistakes:
 *    - Repeated characters (e.g., "aaaaaaaaa")
 *    - Sequential patterns (e.g., "123456", "abcdef")
 *    - Common weak words (e.g., "password", "secret")
 *    - Single character type (e.g., only letters or only numbers)
 * 
 * @param {string} secret - The JWT secret to validate
 * @param {string} name - Name of the secret for error messages (e.g., "JWT_ACCESS_SECRET")
 * @throws {Error} If secret doesn't meet security requirements
 * 
 * @example
 * // Generate a strong secret:
 * // node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
 */
const validateJWTSecret = (secret, name) => {
  // Check 1: Minimum length for sufficient key space
  if (secret.length < 32) {
    throw new Error(`${name} must be at least 32 characters long (current: ${secret.length})`);
  }
  
  // Check 2: Entropy - count unique characters to detect repetitive secrets
  const uniqueChars = new Set(secret).size;
  if (uniqueChars < 16) {
    throw new Error(`${name} has insufficient entropy (too repetitive). Use at least 16 different characters.`);
  }
  
  // Check 3: Detect common weak patterns that attackers might guess
  const weakPatterns = [
    { pattern: /^(.)\1{8,}/, message: 'contains too many repeated characters' },
    { pattern: /^(012|123|abc|password|secret)/i, message: 'contains common weak words' },
    { pattern: /^[a-z]+$/i, message: 'contains only letters (add numbers and symbols)' },
    { pattern: /^[0-9]+$/, message: 'contains only numbers (add letters and symbols)' },
  ];
  
  for (const { pattern, message } of weakPatterns) {
    if (pattern.test(secret)) {
      throw new Error(`${name} ${message}`);
    }
  }
};

// Validate JWT secrets in production
if (process.env.NODE_ENV === 'production') {
  try {
    validateJWTSecret(process.env.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET');
    validateJWTSecret(process.env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');
    logger.info('✅ JWT secrets validated successfully');
  } catch (error) {
    logger.error(`❌ JWT Secret Validation Failed: ${error.message}`);
    logger.error('   Please generate strong secrets using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1);
  }
}

// Warn if OpenAI API key is missing (optional but recommended)
if (!process.env.OPENAI_API_KEY) {
  logger.warn('⚠️  OPENAI_API_KEY not set. AI features will use fallback analysis.');
  logger.warn('   To enable full AI features, set OPENAI_API_KEY in your .env file.');
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');

// Database connection
const connectDB = require('./config/db');

// 🟡 OAuth integration - Passport configuration
const passport = require('./config/passport');
const { getEnabledProviders } = require('./config/oauthProviders');

// Validate OAuth secret if OAuth is enabled
const enabledProviders = getEnabledProviders();
if (enabledProviders.length > 0) {
  if (!process.env.JWT_OAUTH_CODE_SECRET) {
    logger.error('❌ Missing required environment variable: JWT_OAUTH_CODE_SECRET');
    logger.error('   OAuth providers are enabled but JWT_OAUTH_CODE_SECRET is not set.');
    logger.error('   Please set this variable in your .env file or disable OAuth providers.');
    process.exit(1);
  }

  // Validate OAuth secret strength in production
  if (process.env.NODE_ENV === 'production') {
    try {
      validateJWTSecret(process.env.JWT_OAUTH_CODE_SECRET, 'JWT_OAUTH_CODE_SECRET');
      logger.info('✅ OAuth JWT secret validated successfully');
    } catch (error) {
      logger.error(`❌ OAuth JWT Secret Validation Failed: ${error.message}`);
      logger.error('   Please generate a strong secret using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
      process.exit(1);
    }
  }
}

// Middleware imports
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { reAnalysisRateLimit, generalRateLimit } = require('./middleware/rateLimit');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const resumeRoutes = require('./routes/resume');
const coverLetterRoutes = require('./routes/coverLetter');
const oauthRoutes = require('./routes/oauth'); // 🟡 OAuth routes
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration with improved security
const corsOptions = {
  origin: function (origin, callback) {
    // In production, be strict about origins
    if (process.env.NODE_ENV === 'production') {
      // Reject requests with no origin in production (except for same-origin requests)
      if (!origin) {
        // Allow same-origin requests (no origin header)
        return callback(null, true);
      }

      const allowedOrigins = [
        process.env.CLIENT_URL,
        process.env.CLIENT_URL_ALT, // Alternative client URL if needed
      ].filter(Boolean); // Remove undefined values
      
      if (allowedOrigins.length === 0) {
        logger.error('❌ CRITICAL: CLIENT_URL not set in production! CORS will reject all requests.');
        return callback(new Error('CORS configuration error: CLIENT_URL must be set in production'));
      }
      
      // Check if origin matches allowed origins (supports wildcard subdomains)
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed === origin) return true;
        // Support wildcard subdomains: *.example.com
        if (allowed.startsWith('*.')) {
          const domain = allowed.substring(2);
          return origin.endsWith('.' + domain) || origin === domain;
        }
        return false;
      });
      
      if (isAllowed) {
        return callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      }
    }
    
    // Development: allow localhost origins and configured CLIENT_URL
    const devOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:3000',
      'http://localhost:5173', // Vite default port
      'http://localhost:4173', // Vite preview port
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4173',
    ].filter(Boolean);
    
    if (!origin || devOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin in development: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  // Additional security headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Rate limiting configuration
// NOTE: Global rate limiting is NOT applied to allow unrestricted auth routes
// Rate limiters will wait for Redis connection before initializing
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting applied only to expensive analysis endpoints
// This limiter is applied in route files to specific endpoints that consume OpenAI credits

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🟡 OAuth integration - Initialize passport
app.use(passport.initialize());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

/**
 * XSS Protection Middleware - Recursive Sanitization
 * 
 * Recursively sanitizes all string values in request bodies to prevent XSS attacks.
 * Uses the 'xss' library to escape dangerous HTML/JavaScript content.
 * 
 * Key behaviors:
 * - Strings: Escaped using xss() to neutralize script tags, event handlers, etc.
 * - Arrays: Each element is recursively sanitized
 * - Objects: Each property value is recursively sanitized
 * - Buffers/Dates: Preserved as-is (needed for file uploads and timestamps)
 * - Depth limit: Prevents DoS via deeply nested objects (MAX_DEPTH = 10)
 * 
 * @param {any} value - The value to sanitize
 * @param {number} depth - Current recursion depth (internal use)
 * @returns {any} Sanitized value with same structure
 */
const sanitizeValue = (value, depth = 0) => {
  const MAX_DEPTH = 10; // Prevent deep nesting attacks / stack overflow
  
  // Stop recursion if we've gone too deep (possible attack vector)
  if (depth > MAX_DEPTH) {
    return value;
  }
  
  // Sanitize strings - this is where XSS payloads would be neutralized
  if (typeof value === 'string') {
    return xss(value);
  }
  
  // Recursively sanitize array elements
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, depth + 1));
  }
  
  // Handle objects, but preserve special types that shouldn't be modified:
  // - Buffer: Binary data for file uploads
  // - Date: Timestamp objects
  if (value && typeof value === 'object' && !(value instanceof Buffer) && !(value instanceof Date)) {
    const sanitized = {};
    for (const key in value) {
      // Use hasOwnProperty to avoid prototype pollution
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        sanitized[key] = sanitizeValue(value[key], depth + 1);
      }
    }
    return sanitized;
  }
  
  // Primitives (number, boolean, null, undefined) pass through unchanged
  return value;
};

// Only sanitize on POST, PUT, PATCH requests (not GET or file uploads)
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
});

// Request/Response logging middleware
const { logRequest, logSlowRequests } = require('./middleware/requestLogger');
const { recordMetrics } = require('./middleware/metricsMiddleware');
app.use(logRequest);
app.use(recordMetrics); // Record metrics for monitoring
app.use(logSlowRequests(2000)); // Log requests slower than 2 seconds

// Health check route with database and Redis connectivity check
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const { isRedisAvailable } = require('./config/redis');
  
  const healthStatus = {
    success: true,
    message: 'ResumeCraft API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      api: 'healthy',
      database: 'unknown',
      redis: 'unknown',
    },
  };

  // Check database connection
  try {
    if (mongoose.connection.readyState === 1) {
      // Perform a simple query to verify database is responsive
      await mongoose.connection.db.admin().ping();
      healthStatus.services.database = 'healthy';
    } else {
      healthStatus.services.database = 'disconnected';
      healthStatus.success = false;
    }
  } catch (error) {
    healthStatus.services.database = 'unhealthy';
    healthStatus.success = false;
    healthStatus.error = error.message;
  }

  // Check Redis connection
  try {
    const redisAvailable = await isRedisAvailable();
    healthStatus.services.redis = redisAvailable ? 'healthy' : 'unavailable';
    // Redis is optional, so don't mark overall health as failed if it's unavailable
    // but log it for monitoring purposes
    if (!redisAvailable) {
      logger.warn('Redis is unavailable - rate limiting will use in-memory store');
    }
  } catch (error) {
    healthStatus.services.redis = 'unhealthy';
    logger.warn('Redis health check failed:', error.message);
    // Redis is optional, so don't mark overall health as failed
  }

  const statusCode = healthStatus.success ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

// Metrics endpoint (for monitoring)
const metrics = require('./utils/metrics');
app.get('/api/metrics', (req, res) => {
  // Optional: Add authentication for metrics endpoint in production
  if (process.env.NODE_ENV === 'production' && process.env.METRICS_AUTH_TOKEN) {
    const authToken = req.headers['x-metrics-token'];
    if (authToken !== process.env.METRICS_AUTH_TOKEN) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }
  }

  const summary = req.query.summary === 'true';
  const metricsData = summary ? metrics.getSummary() : metrics.getMetrics();
  
  res.json({
    success: true,
    data: metricsData,
  });
});

// Swagger API Documentation
const { swaggerUi, swaggerSpec } = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ResumeCraft API Documentation',
}));

// API versioning - Create v1 router
const v1Router = express.Router();

// Mount all API routes under v1
v1Router.use('/auth', authRoutes);
v1Router.use('/user', userRoutes);
v1Router.use('/resume', resumeRoutes);
v1Router.use('/cover-letter', coverLetterRoutes);
v1Router.use('/cover-letter/analytics', require('./routes/coverLetterAnalytics'));
v1Router.use('/notifications', require('./routes/notifications'));
v1Router.use('/admin', adminRoutes);

// Mount versioned API routes
app.use('/api/v1', v1Router);

// Backward compatibility: Also mount at /api/ (deprecated, will be removed in v2)
// Auth routes are excluded from rate limiting (login, register, refresh-token)
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/cover-letter', coverLetterRoutes);
app.use('/api/cover-letter/analytics', require('./routes/coverLetterAnalytics'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', adminRoutes);

// OAuth routes (no /api prefix for OAuth flow)
app.use('/auth', oauthRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to ResumeCraft API',
    documentation: 'Visit /api/health for health check',
    version: '1.0.0',
  });
});

// Handle undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
🚀 ResumeCraft API Server Started
┌─────────────────────────────────────┐
│  Environment: ${process.env.NODE_ENV || 'development'}
│  Port: ${PORT}
│  Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}
│  OpenAI: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}
│  Time: ${new Date().toISOString()}
└─────────────────────────────────────┘
  `);
});

// Handle server errors
server.on('error', (err) => {
  logger.error('Server error:', err);
  process.exit(1);
});

/**
 * Graceful Shutdown Handler
 * 
 * Ensures clean server shutdown when receiving termination signals (SIGTERM, SIGINT).
 * This is critical for:
 * - Container orchestration (Kubernetes, Docker) - allows in-flight requests to complete
 * - Database integrity - properly closes MongoDB connections
 * - Resource cleanup - prevents connection leaks
 * 
 * Shutdown sequence:
 * 1. Stop accepting new connections (server.close())
 * 2. Wait for existing requests to complete (up to 30s timeout)
 * 3. Close database connections
 * 4. Exit process with appropriate code
 * 
 * @param {string} signal - The signal received (SIGTERM or SIGINT)
 */
const gracefulShutdown = async (signal) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);
  
  const shutdownTimeout = setTimeout(() => {
    logger.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 30000); // 30 second timeout
  
  shutdownTimeout.unref();
  
  try {
    // Stop accepting new connections
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info('✅ HTTP server closed');
    }
    
    // Close database connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('✅ Database connection closed');
    }
    
    logger.info('✅ Graceful shutdown completed');
    clearTimeout(shutdownTimeout);
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions with cleanup
process.on('uncaughtException', async (err) => {
  logger.error('❌ FATAL: Uncaught Exception:', err);
  
  try {
    const cleanupTimeout = setTimeout(() => {
      logger.error('Cleanup timeout exceeded. Force exit.');
      process.exit(1);
    }, 10000);
    
    cleanupTimeout.unref();
    
    // Close server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    
    // Close database
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    logger.info('Cleanup completed after uncaught exception');
    clearTimeout(cleanupTimeout);
    process.exit(1);
  } catch (cleanupError) {
    logger.error('Cleanup failed:', cleanupError);
    process.exit(1);
  }
});

// Handle unhandled promise rejections with cleanup
process.on('unhandledRejection', async (err) => {
  logger.error('❌ FATAL: Unhandled Promise Rejection:', err);
  
  try {
    const cleanupTimeout = setTimeout(() => {
      logger.error('Cleanup timeout exceeded. Force exit.');
      process.exit(1);
    }, 10000);
    
    cleanupTimeout.unref();
    
    // Close server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    
    // Close database
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    logger.info('Cleanup completed after unhandled rejection');
    clearTimeout(cleanupTimeout);
    process.exit(1);
  } catch (cleanupError) {
    logger.error('Cleanup failed:', cleanupError);
    process.exit(1);
  }
});

module.exports = app;
