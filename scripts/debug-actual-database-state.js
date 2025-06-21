const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function debugActualDatabaseState() {
  console.log('🔍 DEBUGGING ACTUAL DATABASE STATE 🔍');
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return;
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // Check all games
    console.log('\n📋 ALL GAMES:');
    const allGames = await sql`
      SELECT id, base_word, status, created_at, is_public
      FROM games
      ORDER BY created_at DESC
    `;
    console.table(allGames);

    // Check all game_players
    console.log('\n👥 ALL GAME PLAYERS:');
    const allPlayers = await sql`
      SELECT id, game_id, user_id, username, is_host, ready
      FROM game_players
      ORDER BY game_id, joined_at
    `;
    console.table(allPlayers);

    // Check the problematic query step by step
    console.log('\n🔍 TESTING THE PROBLEMATIC QUERY:');
    
    // Step 1: Get all public waiting games
    const publicWaitingGames = await sql`
      SELECT id, base_word, status
      FROM games
      WHERE is_public = true AND status = 'waiting'
    `;
    console.log('Public waiting games:', publicWaitingGames);

    // Step 2: For each game, count players manually
    for (const game of publicWaitingGames) {
      const playerCount = await sql`
        SELECT COUNT(*) as count
        FROM game_players
        WHERE game_id = ${game.id}
      `;
      console.log(`Game ${game.base_word} (${game.id}): ${playerCount[0].count} players`);
      
      // Show actual players
      const players = await sql`
        SELECT id, user_id, username, is_host, ready
        FROM game_players
        WHERE game_id = ${game.id}
      `;
      console.log(`  Players:`, players);
    }

    // Step 3: Test the exact query from the API
    console.log('\n🔍 TESTING EXACT API QUERY:');
    const apiQueryResult = await sql`
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
    console.log('API Query Result:', apiQueryResult);

  } catch (error) {
    console.error('Error debugging database state:', error);
  }
}

debugActualDatabaseState(); 