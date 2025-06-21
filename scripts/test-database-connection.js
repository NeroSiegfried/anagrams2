require('dotenv').config({ path: '.env.local' });
const { query } = require('../lib/db');

async function testDatabaseConnection() {
  console.log('🔍 TESTING DATABASE CONNECTION 🔍');
  
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    
    // Test 1: Get all games
    console.log('\n=== TEST 1: ALL GAMES ===');
    const allGames = await query(`
      SELECT id, base_word, status, created_at
      FROM games
      ORDER BY created_at DESC
    `);
    console.log('All games:', allGames?.rows || []);
    
    // Test 2: Get the specific problematic games
    console.log('\n=== TEST 2: PROBLEMATIC GAMES ===');
    const problematicGames = await query(`
      SELECT id, base_word, status, created_at
      FROM games
      WHERE id IN ('eef0efc3-ff88-450f-8a2a-e9bff49ed235', '3f39c8c1-e3db-40c3-81f7-b1ced635a159')
    `);
    console.log('Problematic games:', problematicGames?.rows || []);
    
    // Test 3: Get the valid games
    console.log('\n=== TEST 3: VALID GAMES ===');
    const validGames = await query(`
      SELECT id, base_word, status, created_at
      FROM games
      WHERE id IN ('cdc478aa-78e3-422f-8e91-07408c9e4b1f', 'ec5301de-538f-486c-a429-17d729e04ab6')
    `);
    console.log('Valid games:', validGames?.rows || []);
    
    // Test 4: Check if we're using pooled vs unpooled connection
    console.log('\n=== TEST 4: CONNECTION TYPE ===');
    if (process.env.DATABASE_URL?.includes('pooler')) {
      console.log('Using POOLED connection');
    } else {
      console.log('Using UNPOOLED connection');
    }
    
  } catch (error) {
    console.error('Error testing database connection:', error);
  }
}

testDatabaseConnection().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 