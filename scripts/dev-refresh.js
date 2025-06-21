#!/usr/bin/env node

/**
 * Development server refresh utility
 * This script helps refresh the development server state without a hard reset
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Development Refresh Script');
console.log('============================');

// Check for common issues
console.log('\n📋 Checking for common issues...');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  Warning: .env.local file not found');
} else {
  console.log('✅ .env.local file found');
}

// Check if .next directory exists and is corrupted
const nextPath = path.join(process.cwd(), '.next');
if (fs.existsSync(nextPath)) {
  try {
    fs.accessSync(nextPath, fs.constants.R_OK);
    console.log('✅ .next directory accessible');
  } catch (error) {
    console.log('❌ .next directory corrupted or inaccessible');
    console.log('   Removing .next directory...');
    exec('rm -rf .next', (error) => {
      if (error) {
        console.log('   Failed to remove .next directory');
      } else {
        console.log('   ✅ .next directory removed');
      }
    });
  }
} else {
  console.log('ℹ️  .next directory not found (will be created)');
}

// Check node_modules
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ node_modules found');
} else {
  console.log('❌ node_modules not found - run npm install first');
  process.exit(1);
}

// Check package-lock.json
const lockPath = path.join(process.cwd(), 'package-lock.json');
if (fs.existsSync(lockPath)) {
  console.log('✅ package-lock.json found');
} else {
  console.log('⚠️  package-lock.json not found - consider running npm install');
}

console.log('\n🚀 Starting development server...');
console.log('   Use Ctrl+C to stop the server');
console.log('   If you experience issues, try:');
console.log('   - npm run dev:stable (for memory issues)');
console.log('   - Clear browser cache');
console.log('   - Check browser console for errors');
console.log('');

// Start the development server
const child = exec('npm run dev', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Development server failed to start:', error);
    return;
  }
  if (stderr) {
    console.error('⚠️  Development server warnings:', stderr);
  }
  console.log('✅ Development server output:', stdout);
});

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  child.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down development server...');
  child.kill('SIGTERM');
  process.exit(0);
}); 