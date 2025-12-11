/**
 * Application-wide constants
 * Centralized configuration values to avoid magic numbers/strings throughout the codebase
 * @module config/constants
 */

module.exports = {
  // ============================================
  // Cookie Names
  // ============================================
  REFRESH_TOKEN_COOKIE: 'rc_refresh_token',
  
  // ============================================
  // Pagination
  // ============================================
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // ============================================
  // Validation Limits
  // ============================================
  MIN_JD_LENGTH: 50,
  MAX_JD_LENGTH: 10000,
  MIN_RESUME_TEXT_LENGTH: 100,
  MIN_SEARCH_QUERY_LENGTH: 2,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // ============================================
  // Security & Authentication
  // ============================================
  BCRYPT_SALT_ROUNDS: 12,
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  REFRESH_TOKEN_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  MIN_JWT_SECRET_LENGTH: 32,
  MIN_JWT_SECRET_UNIQUE_CHARS: 16,
  
  // ============================================
  // Rate Limiting
  // ============================================
  DAILY_REANALYSIS_LIMIT: 5,
  AUTH_RATE_LIMIT: 20,
  GENERAL_RATE_LIMIT: 100,
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  
  // ============================================
  // Timeouts (in milliseconds)
  // ============================================
  API_TIMEOUT_MS: 30000,                    // 30 seconds - standard API timeout
  AI_ANALYSIS_TIMEOUT_MS: 120000,           // 2 minutes - AI analysis operations
  GRACEFUL_SHUTDOWN_TIMEOUT_MS: 30000,      // 30 seconds - server shutdown
  CLEANUP_TIMEOUT_MS: 10000,                // 10 seconds - cleanup operations
  
  // ============================================
  // Caching (in milliseconds)
  // ============================================
  CACHE_TTL_MS: 30000,                      // 30 seconds - default cache TTL
  NOTIFICATION_DUPLICATE_WINDOW_HOURS: 24,  // Hours to check for duplicate notifications
  
  // ============================================
  // Interview Notifications
  // ============================================
  INTERVIEW_NOTIFY_WINDOW_HOURS: 168,       // 7 days - max hours before interview to notify
  INTERVIEW_URGENT_HOURS: 2,                // Hours before interview is considered urgent
  
  // ============================================
  // File Uploads
  // ============================================
  ALLOWED_FILE_TYPES: ['pdf', 'docx'],
  
  // ============================================
  // MongoDB
  // ============================================
  MONGO_BSON_MAX_SIZE: 16 * 1024 * 1024, // 16MB
  MAX_EMBEDDED_ARRAY_SIZE: 100,
  
  // ============================================
  // XSS Protection
  // ============================================
  MAX_SANITIZE_DEPTH: 10,                   // Max depth for recursive sanitization
  
  // ============================================
  // Activity & Logging
  // ============================================
  DEFAULT_ACTIVITY_LIMIT: 50,
  DEFAULT_FOLLOW_UP_DAYS: 7,
  
  // ============================================
  // Resume Analysis
  // ============================================
  MAX_RESUME_TEXT_LENGTH: 50000,              // Max characters in extracted resume text
  ANALYSIS_CACHE_TTL_MS: 7 * 24 * 60 * 60 * 1000, // 7 days - cache analysis results
  ANALYSIS_DEDUPLICATION_WINDOW_MS: 60 * 60 * 1000, // 1 hour - prevent duplicate analyses
  ANALYSIS_MAX_RETRIES: 3,                     // Max retry attempts for failed analysis
  ANALYSIS_RETRY_DELAY_MS: 5000,               // Initial retry delay (exponential backoff)
  OLD_ANALYSIS_RETENTION_DAYS: 90,             // Days to keep old analyses before cleanup
  
  // ============================================
  // Analysis Rate Limiting
  // ============================================
  ANALYSIS_RATE_LIMIT_PER_USER: 10,            // Max concurrent analyses per user
  ANALYSIS_RATE_LIMIT_WINDOW_MS: 60 * 60 * 1000, // 1 hour window
  
  // ============================================
  // Polling Configuration
  // ============================================
  POLLING_INTERVAL_MS: 2000,                   // Default polling interval
  POLLING_MAX_ATTEMPTS: 30,                    // Max polling attempts (60 seconds total)
  
  // ============================================
  // Pagination
  // ============================================
  DEFAULT_ANALYSIS_PAGE_SIZE: 10,
  MAX_ANALYSIS_PAGE_SIZE: 50,
  
  // ============================================
  // Cover Letter Generation
  // ============================================
  MAX_COVER_LETTER_RESUME_LENGTH: 10000,        // Max characters in resume text for cover letter
  MAX_COVER_LETTER_JD_LENGTH: 5000,             // Max characters in job description for cover letter
  COVER_LETTER_CACHE_TTL_MS: 7 * 24 * 60 * 60 * 1000, // 7 days - cache cover letter results
  COVER_LETTER_MAX_RETRIES: 3,                  // Max retry attempts for failed generation
  COVER_LETTER_RETRY_DELAY_MS: 2000,            // Initial retry delay (exponential backoff)
  COVER_LETTER_RATE_LIMIT_PER_USER: 20,         // Max cover letters per user per hour
  COVER_LETTER_RATE_LIMIT_WINDOW_MS: 60 * 60 * 1000, // 1 hour window
  COVER_LETTER_MAX_TOKENS: 128000,              // GPT-4o-mini context window
  COVER_LETTER_ESTIMATED_OUTPUT_TOKENS: 500,    // Estimated output tokens
  COVER_LETTER_TIMEOUT_MS: 60000,               // 60 seconds timeout
};
