require('dotenv').config({ path: '.env.local' });
const { query } = require('../lib/db');

async function debugPublicGames() {
  console.log('🔍 DEBUGGING PUBLIC GAMES ISSUE 🔍');
  
  try {
    // First, let's see what games exist
    console.log('\n=== ALL GAMES ===');
    const allGames = await query(`
      SELECT id, base_word, status, is_public, created_at, max_players
      FROM games
      ORDER BY created_at DESC
    `);
    console.log('All games:', allGames?.rows || []);

    // Check the specific problematic games
    console.log('\n=== PROBLEMATIC GAMES ===');
    const problematicGames = await query(`
      SELECT id, base_word, status, is_public, created_at, max_players
      FROM games
      WHERE id IN ('eef0efc3-ff88-450f-8a2a-e9bff49ed635a159', '3f39c8c1-e3db-40c3-81f7-b1ced635a159')
    `);
    console.log('Problematic games:', problematicGames?.rows || []);

    // Check players for each problematic game
    for (const game of problematicGames?.rows || []) {
      console.log(`\n=== PLAYERS FOR GAME ${game.id} ===`);
      const players = await query(`
        SELECT id, user_id, username, is_host, ready, joined_at
        FROM game_players
        WHERE game_id = $1
      `, [game.id]);
      console.log(`Game ${game.base_word} (${game.id}) players:`, players?.rows || []);
    }

    // Test the exact query from the API
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

    // Test the cleanup query
    console.log('\n=== CLEANUP QUERY TEST ===');
    const cleanupTest = await query(`
      SELECT g.id, g.base_word, COUNT(gp.id) as actual_player_count
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      WHERE g.is_public = true AND g.status = 'waiting'
      GROUP BY g.id, g.base_word
      HAVING COUNT(gp.id) = 0
    `);
    console.log('Games that should be cleaned up (0 players):', cleanupTest?.rows || []);

    // Check for any orphaned game_players
    console.log('\n=== ORPHANED PLAYERS ===');
    const orphanedPlayers = await query(`
      SELECT gp.id, gp.game_id, gp.username
      FROM game_players gp
      LEFT JOIN games g ON gp.game_id = g.id
      WHERE g.id IS NULL
    `);
    console.log('Orphaned players:', orphanedPlayers?.rows || []);

  } catch (error) {
    console.error('Error debugging:', error);
  }
}

debugPublicGames().then(() => {
  console.log('\n✅ Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
}); 