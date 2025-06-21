const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testApiDatabase() {
  try {
    console.log('=== TESTING API DATABASE CONNECTION ===');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('DATABASE_URL_UNPOOLED:', process.env.DATABASE_URL_UNPOOLED ? 'SET' : 'NOT SET');
    
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not set');
      return;
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Test the exact same query the API uses
    console.log('\n=== TESTING API QUERY ===');
    const result = await sql`
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
    `;
    
    console.log('API query result:', result);
    console.log('Number of games found:', result.length);
    
    if (result.length > 0) {
      console.log('Games found:');
      result.forEach(game => {
        console.log(`- ${game.base_word} (${game.id}) - players: ${game.player_count}`);
      });
    }

  } catch (error) {
    console.error('Error testing API database:', error);
  }
}

testApiDatabase(); 