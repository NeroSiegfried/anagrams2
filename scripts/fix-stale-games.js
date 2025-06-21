require('dotenv').config({ path: '.env.local' });
const { query } = require('../lib/db');

async function fixStaleGames() {
  console.log('🔧 FIXING STALE GAMES DATA INCONSISTENCY 🔧');
  
  try {
    // Get all public waiting games
    console.log('\n=== CHECKING ALL PUBLIC WAITING GAMES ===');
    const games = await query(`
      SELECT 
        g.id,
        g.base_word,
        g.status,
        g.created_at,
        COUNT(gp.id) as player_count
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      WHERE g.is_public = true AND g.status = 'waiting'
      GROUP BY g.id, g.base_word, g.status, g.created_at
      ORDER BY g.created_at DESC
    `);
    
    console.log('Games found:', games?.rows || []);
    
    if (!games?.rows || games.rows.length === 0) {
      console.log('No games to check.');
      return;
    }
    
    // Check each game's actual players
    for (const game of games.rows) {
      console.log(`\n=== CHECKING GAME: ${game.base_word} (${game.id}) ===`);
      console.log(`Reported player count: ${game.player_count}`);
      
      // Get actual players for this game
      const players = await query(`
        SELECT id, user_id, username, is_host, ready
        FROM game_players
        WHERE game_id = $1
        ORDER BY joined_at ASC
      `, [game.id]);
      
      const actualPlayerCount = players?.rows?.length || 0;
      console.log(`Actual players found: ${actualPlayerCount}`);
      console.log('Players:', players?.rows || []);
      
      // If there's a mismatch or no players, fix it
      if (actualPlayerCount === 0) {
        console.log(`❌ Game has no players - DELETING game ${game.id}`);
        const deleteResult = await query(`
          DELETE FROM games WHERE id = $1 RETURNING id
        `, [game.id]);
        console.log(`Deleted game:`, deleteResult?.rows || []);
      } else if (parseInt(game.player_count) !== actualPlayerCount) {
        console.log(`⚠️  Player count mismatch - game has ${actualPlayerCount} players but reports ${game.player_count}`);
        // This is just a reporting issue, not a deletion issue
      } else {
        console.log(`✅ Game is valid with ${actualPlayerCount} players`);
      }
    }
    
    // Final check
    console.log('\n=== FINAL CHECK ===');
    const finalGames = await query(`
      SELECT 
        g.id,
        g.base_word,
        g.status,
        COUNT(gp.id) as player_count
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      WHERE g.is_public = true AND g.status = 'waiting'
      GROUP BY g.id, g.base_word, g.status
      HAVING COUNT(gp.id) > 0
      ORDER BY g.created_at DESC
    `);
    
    console.log('Remaining valid games:', finalGames?.rows || []);
    
  } catch (error) {
    console.error('Error fixing stale games:', error);
  }
}

fixStaleGames().then(() => {
  console.log('\n✅ Fix completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
}); 