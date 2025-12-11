/**
 * Redis Connection Test Script
 * Tests Redis connection and basic operations
 */

require('dotenv').config();
const { getRedisClient, isRedisAvailable } = require('../config/redis');

(async () => {
  console.log('🔍 Testing Redis connection...\n');

  try {
    // Test 1: Check if Redis is available
    console.log('Test 1: Checking Redis availability...');
    const available = await isRedisAvailable();
    
    if (!available) {
      console.error('❌ Redis is not available');
      console.log('\n⚠️  Possible issues:');
      console.log('   - Redis is not running');
      console.log('   - REDIS_HOST or REDIS_PORT is incorrect');
      console.log('   - Firewall is blocking the connection');
      console.log('   - Redis password is incorrect (if set)');
      console.log('\n📝 Check your backend/.env file:');
      console.log('   REDIS_HOST=' + (process.env.REDIS_HOST || 'localhost'));
      console.log('   REDIS_PORT=' + (process.env.REDIS_PORT || '6379'));
      console.log('   REDIS_PASSWORD=' + (process.env.REDIS_PASSWORD ? '***' : '(not set)'));
      console.log('\n⚠️  Application will use in-memory fallback (not suitable for production)');
      process.exit(1);
    }

    console.log('✅ Redis is available\n');

    // Test 2: Get client and test basic operations
    console.log('Test 2: Testing basic Redis operations...');
    const client = getRedisClient();
    
    if (!client) {
      console.error('❌ Failed to get Redis client');
      process.exit(1);
    }

    // Test PING
    const pingResult = await client.ping();
    console.log('   ✅ PING:', pingResult);

    // Test SET/GET
    const testKey = 'resumecraft:test:' + Date.now();
    const testValue = 'test-value-' + Math.random();
    
    await client.set(testKey, testValue, 'EX', 10); // Expires in 10 seconds
    console.log('   ✅ SET operation successful');

    const getValue = await client.get(testKey);
    if (getValue === testValue) {
      console.log('   ✅ GET operation successful');
    } else {
      console.error('   ❌ GET operation failed: value mismatch');
      process.exit(1);
    }

    // Test DELETE
    await client.del(testKey);
    const deletedValue = await client.get(testKey);
    if (deletedValue === null) {
      console.log('   ✅ DELETE operation successful');
    } else {
      console.error('   ❌ DELETE operation failed');
      process.exit(1);
    }

    // Test 3: Check Redis info
    console.log('\nTest 3: Redis server information...');
    const info = await client.info('server');
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    if (versionMatch) {
      console.log('   ✅ Redis version:', versionMatch[1]);
    }

    const memoryInfo = await client.info('memory');
    const usedMemoryMatch = memoryInfo.match(/used_memory_human:([^\r\n]+)/);
    if (usedMemoryMatch) {
      console.log('   ✅ Memory usage:', usedMemoryMatch[1]);
    }

    // Test 4: Test with prefix (as used in rate limiting)
    console.log('\nTest 4: Testing with rate limit prefix...');
    const rateLimitKey = 'rl:test:' + Date.now();
    await client.setex(rateLimitKey, 60, '1');
    const rateLimitValue = await client.get(rateLimitKey);
    if (rateLimitValue === '1') {
      console.log('   ✅ Rate limit key operations successful');
    }
    await client.del(rateLimitKey);

    // Test 5: Test with cover letter cache prefix
    console.log('\nTest 5: Testing with cache prefix...');
    const cacheKey = 'coverletter:test:' + Date.now();
    const cacheValue = JSON.stringify({ test: 'data' });
    await client.setex(cacheKey, 60, cacheValue);
    const cachedValue = await client.get(cacheKey);
    if (cachedValue === cacheValue) {
      console.log('   ✅ Cache key operations successful');
    }
    await client.del(cacheKey);

    console.log('\n✅ All Redis tests passed!');
    console.log('\n📊 Summary:');
    console.log('   - Redis connection: ✅ Working');
    console.log('   - Basic operations: ✅ Working');
    console.log('   - Rate limiting: ✅ Ready');
    console.log('   - Caching: ✅ Ready');
    console.log('\n🚀 Your application is ready to use Redis!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Redis test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    console.log('\n⚠️  Application will use in-memory fallback (not suitable for production)');
    process.exit(1);
  }
})();

