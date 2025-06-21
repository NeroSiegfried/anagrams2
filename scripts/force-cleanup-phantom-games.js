const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function forceCleanupPhantomGames() {
  console.log('🧹 FORCE CLEANUP PHANTOM GAMES 🧹');
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    return;
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    // First, let's see what games exist
    console.log('\n📋 Current games in database:');
    const allGames = await sql`
      SELECT g.id, g.base_word, g.status, COUNT(gp.id) as player_count
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      GROUP BY g.id, g.base_word, g.status
      ORDER BY g.created_at DESC
    `;
    console.table(allGames);

    // Delete the specific phantom games
    console.log('\n🗑️ Deleting phantom games...');
    const deleteResult = await sql`
      DELETE FROM games 
      WHERE base_word IN ('ostium', 'streit')
      RETURNING id, base_word
    `;
    console.log('Deleted phantom games:', deleteResult);

    // Clean up any orphaned players
    console.log('\n🧹 Cleaning up orphaned players...');
    const orphanedResult = await sql`
      DELETE FROM game_players 
      WHERE game_id NOT IN (SELECT id FROM games)
      RETURNING id, game_id
    `;
    console.log('Deleted orphaned players:', orphanedResult);

    // Show final state
    console.log('\n✅ Final games in database:');
    const finalGames = await sql`
      SELECT g.id, g.base_word, g.status, COUNT(gp.id) as player_count
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      GROUP BY g.id, g.base_word, g.status
      ORDER BY g.created_at DESC
    `;
    console.table(finalGames);

    console.log('\n🎉 Force cleanup completed!');

  } catch (error) {
    console.error('Error during force cleanup:', error);
  }
}

forceCleanupPhantomGames(); 