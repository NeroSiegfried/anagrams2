#!/usr/bin/env node

/**
 * Development server refresh utility
 * This script helps refresh the development server state without a hard reset
 */

const http = require('http');

async function refreshServer() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/debug/refresh',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🔄 Refreshing development server state...');
    const result = await refreshServer();
    console.log('✅ Server refreshed successfully:', result.message);
    console.log('⏰ Timestamp:', result.timestamp);
  } catch (error) {
    console.error('❌ Failed to refresh server:', error.message);
    console.log('\n💡 Make sure your development server is running on port 3000');
    console.log('💡 If the server is not responding, you may need to restart it manually');
  }
}

if (require.main === module) {
  main();
}

module.exports = { refreshServer }; 