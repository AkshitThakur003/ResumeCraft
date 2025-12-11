/**
 * Error Tracking Utility
 * Provides centralized error tracking with Sentry (optional)
 * Falls back gracefully if Sentry is not configured
 */

let Sentry = null;
let isSentryInitialized = false;

// Try to initialize Sentry if DSN is provided
if (process.env.SENTRY_DSN) {
  try {
    Sentry = require('@sentry/node');
    
    // Build integrations array
    const integrations = [];
    
    // Try to add ProfilingIntegration if available (optional)
    try {
      const profilingModule = require('@sentry/profiling-node');
      // Handle both default export and named export
      const ProfilingIntegration = profilingModule.ProfilingIntegration || profilingModule.default || profilingModule;
      if (ProfilingIntegration && typeof ProfilingIntegration === 'function') {
        integrations.push(new ProfilingIntegration());
      }
    } catch (profilingError) {
      // Profiling is optional, continue without it
      if (process.env.NODE_ENV === 'development') {
        console.log('ℹ️  Profiling integration not available, continuing without it');
      }
    }

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      integrations: integrations.length > 0 ? integrations : undefined,
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // Set sampling rate for profiling (only if ProfilingIntegration is available)
      ...(integrations.length > 0 && {
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      }),
    });

    isSentryInitialized = true;
    if (process.env.NODE_ENV === 'production') {
      console.log('✅ Sentry error tracking initialized');
    } else {
      console.log('✅ Sentry error tracking initialized (development mode)');
    }
  } catch (error) {
    console.warn('⚠️  Failed to initialize Sentry:', error.message);
  }
} else {
  // Only show this message in development to avoid noise in production
  if (process.env.NODE_ENV === 'development') {
    console.log('ℹ️  Sentry DSN not provided. Error tracking disabled. (Optional - add SENTRY_DSN to enable)');
  }
}

/**
 * Capture an exception
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
const captureException = (error, context = {}) => {
  if (isSentryInitialized && Sentry) {
    Sentry.withScope((scope) => {
      if (context.user) {
        scope.setUser({ id: context.user._id, email: context.user.email });
      }
      if (context.tags) {
        Object.keys(context.tags).forEach(key => {
          scope.setTag(key, context.tags[key]);
        });
      }
      if (context.extra) {
        Object.keys(context.extra).forEach(key => {
          scope.setExtra(key, context.extra[key]);
        });
      }
      Sentry.captureException(error);
    });
  }
};

/**
 * Capture a message
 * @param {string} message - The message to capture
 * @param {string} level - Log level (info, warning, error)
 * @param {Object} context - Additional context
 */
const captureMessage = (message, level = 'info', context = {}) => {
  if (isSentryInitialized && Sentry) {
    Sentry.withScope((scope) => {
      if (context.user) {
        scope.setUser({ id: context.user._id, email: context.user.email });
      }
      if (context.tags) {
        Object.keys(context.tags).forEach(key => {
          scope.setTag(key, context.tags[key]);
        });
      }
      Sentry.captureMessage(message, level);
    });
  }
};

/**
 * Set user context for error tracking
 * @param {Object} user - User object
 */
const setUser = (user) => {
  if (isSentryInitialized && Sentry) {
    Sentry.setUser({
      id: user._id?.toString(),
      email: user.email,
    });
  }
};

/**
 * Add breadcrumb for debugging
 * @param {Object} breadcrumb - Breadcrumb data
 */
const addBreadcrumb = (breadcrumb) => {
  if (isSentryInitialized && Sentry) {
    Sentry.addBreadcrumb(breadcrumb);
  }
};

module.exports = {
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  isSentryInitialized,
};

