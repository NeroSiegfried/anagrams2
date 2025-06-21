require('dotenv').config({ path: '.env.local' });
const { query } = require('../lib/db');

async function testApiDatabase() {
  console.log('🔍 TESTING API DATABASE CONNECTION 🔍');
  
  try {
    // Test the exact same query as the API
    console.log('\n=== API MAIN QUERY TEST ===');
    const apiQueryResult = await query(`
      SELECT 
        g.id,
        g.base_word,
        g.created_by,
        u.username as creator_username,
        g.status,
        g.current_round,
        g.time_limit,
        g.max_players,
        g.created_at,
        COUNT(gp.id) as player_count
      FROM games g
      LEFT JOIN users u ON g.created_by = u.id
      LEFT JOIN game_players gp ON g.id = gp.game_id
      WHERE g.is_public = true 
        AND g.status = 'waiting'
      GROUP BY g.id, g.base_word, g.created_by, u.username, g.status, g.current_round, g.time_limit, g.max_players, g.created_at
      HAVING COUNT(gp.id) > 0 AND COUNT(gp.id) < g.max_players
      ORDER BY g.created_at DESC
      LIMIT 20
    `);
    console.log('API query result:', apiQueryResult?.rows || []);
    console.log('Number of games found:', apiQueryResult?.rows?.length || 0);

    // Check all games to see what's actually in the database
    console.log('\n=== ALL GAMES IN DATABASE ===');
    const allGames = await query(`
      SELECT id, base_word, status, is_public, created_at, max_players
      FROM games
      ORDER BY created_at DESC
    `);
    console.log('All games:', allGames?.rows || []);
    console.log('Total games:', allGames?.rows?.length || 0);

  } catch (error) {
    console.error('Error testing API database:', error);
  }
}

testApiDatabase().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 