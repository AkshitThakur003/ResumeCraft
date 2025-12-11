/**
 * Jest Setup File
 * Runs before all tests to configure the test environment
 */

// Ensure NODE_ENV is set to 'test'
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Disable rate limiting in tests
process.env.DISABLE_RATE_LIMIT = 'true';

// Set test-specific environment variables
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret_key_for_jest_minimum_32_chars';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_key_for_jest_minimum_32_chars';

console.log('✅ Jest setup: Rate limiting disabled for tests');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   DISABLE_RATE_LIMIT: ${process.env.DISABLE_RATE_LIMIT}`);

