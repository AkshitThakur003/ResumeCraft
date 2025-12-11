#!/usr/bin/env node

/**
 * Health Check Script
 * Checks if the backend server is running and healthy
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/health',
  method: 'GET',
  timeout: 5000,
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const health = JSON.parse(data);
      
      if (res.statusCode === 200 && health.success) {
        console.log('✅ Backend server is healthy');
        console.log(`   Status: ${health.services?.api || 'unknown'}`);
        console.log(`   Database: ${health.services?.database || 'unknown'}`);
        if (health.environment) {
          console.log(`   Environment: ${health.environment}`);
        }
        process.exit(0);
      } else {
        console.error('❌ Backend server is unhealthy');
        console.error(`   Status Code: ${res.statusCode}`);
        if (health.message) {
          console.error(`   Message: ${health.message}`);
        }
        if (health.services) {
          console.error(`   Services Status:`);
          Object.entries(health.services).forEach(([service, status]) => {
            const icon = status === 'healthy' ? '✅' : '❌';
            console.error(`     ${icon} ${service}: ${status}`);
          });
        }
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to parse health check response');
      console.error(`   Error: ${error.message || 'Invalid JSON response'}`);
      console.error(`   Raw response: ${data.substring(0, 200)}...`);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Failed to connect to backend server');
  if (error.code === 'ECONNREFUSED') {
    console.error(`   Connection refused - server is not running on port ${options.port}`);
  } else if (error.code === 'ETIMEDOUT') {
    console.error(`   Connection timed out - server may be slow to respond`);
  } else {
    console.error(`   Error: ${error.message || error.code || 'Unknown error'}`);
  }
  console.error(`   Make sure the server is running on port ${options.port}`);
  console.error(`   Start it with: npm run dev`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Health check request timed out');
  req.destroy();
  process.exit(1);
});

req.end();

