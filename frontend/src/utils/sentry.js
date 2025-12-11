/**
 * Sentry Error Tracking Configuration
 * @module utils/sentry
 */

/**
 * Initialize Sentry for error tracking
 * Only initializes in production or when SENTRY_DSN is provided
 */
export const initSentry = () => {
  // Only initialize in production or when explicitly enabled
  const isProduction = import.meta.env.PROD;
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!sentryDsn || (!isProduction && !import.meta.env.VITE_ENABLE_SENTRY)) {
    return null;
  }

  try {
    // Dynamic import to avoid including Sentry in bundle if not needed
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: sentryDsn,
        environment: import.meta.env.MODE || 'development',
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
        // Performance Monitoring
        tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in dev
        // Session Replay
        replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
        replaysOnErrorSampleRate: 1.0, // Always record replays on errors
        
        // Filter out sensitive data
        beforeSend(event, hint) {
          // Don't send events in development unless explicitly enabled
          if (!isProduction && !import.meta.env.VITE_ENABLE_SENTRY) {
            return null;
          }

          // Remove sensitive data from URLs
          if (event.request?.url) {
            event.request.url = event.request.url.replace(/token=[^&]*/g, 'token=[REDACTED]');
            event.request.url = event.request.url.replace(/password=[^&]*/g, 'password=[REDACTED]');
          }

          // Remove sensitive data from headers
          if (event.request?.headers) {
            const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
            sensitiveHeaders.forEach(header => {
              if (event.request.headers[header]) {
                event.request.headers[header] = '[REDACTED]';
              }
            });
          }

          return event;
        },

        // Ignore certain errors
        ignoreErrors: [
          // Browser extensions
          'top.GLOBALS',
          'originalCreateNotification',
          'canvas.contentDocument',
          'MyApp_RemoveAllHighlights',
          'atomicFindClose',
          'fb_xd_fragment',
          'bmi_SafeAddOnload',
          'EBCallBackMessageReceived',
          // Network errors that are expected
          'NetworkError',
          'Network request failed',
          'Failed to fetch',
          // Chrome extensions
          'chrome-extension://',
          'moz-extension://',
        ],
      });
    });
  } catch (error) {
    // Silently fail if Sentry can't be initialized
    console.warn('Sentry initialization failed:', error);
  }
};

/**
 * Capture an exception manually
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context
 */
export const captureException = async (error, context = {}) => {
  try {
    const Sentry = await import('@sentry/react');
    Sentry.captureException(error, context);
  } catch (err) {
    // Silently fail if Sentry is not available
    console.warn('Failed to capture exception:', err);
  }
};

/**
 * Capture a message manually
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (info, warning, error)
 */
export const captureMessage = async (message, level = 'info') => {
  try {
    const Sentry = await import('@sentry/react');
    Sentry.captureMessage(message, level);
  } catch (err) {
    // Silently fail if Sentry is not available
    console.warn('Failed to capture message:', err);
  }
};

/**
 * Set user context for error tracking
 * @param {Object} user - User information
 */
export const setUser = async (user) => {
  try {
    const Sentry = await import('@sentry/react');
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username || user.name,
      // Don't include sensitive data
    });
  } catch (err) {
    // Silently fail if Sentry is not available
    console.warn('Failed to set user context:', err);
  }
};

/**
 * Clear user context
 */
export const clearUser = async () => {
  try {
    const Sentry = await import('@sentry/react');
    Sentry.setUser(null);
  } catch (err) {
    // Silently fail if Sentry is not available
    console.warn('Failed to clear user context:', err);
  }
};

