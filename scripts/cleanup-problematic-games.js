import { query } from '../lib/db.ts';

async function cleanupProblematicGames() {
  console.log('🧹 Starting cleanup of problematic games...');
  
  try {
    // First, let's see what games exist
    console.log('\n📋 Current games in database:');
    const allGames = await query(`
      SELECT 
        g.id,
        g.base_word,
        g.status,
        g.created_at,
        COUNT(gp.id) as player_count
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      GROUP BY g.id, g.base_word, g.status, g.created_at
      ORDER BY g.created_at DESC
    `);
    
    console.log('All games:', allGames.rows);
    
    // Check the specific problematic games
    console.log('\n🔍 Checking specific problematic games:');
    const game1 = await query(`
      SELECT 
        g.id,
        g.base_word,
        g.status,
        g.created_at,
        COUNT(gp.id) as player_count
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      WHERE g.id = 'eef0efc3-ff88-450f-8a2a-e9bff49ed235'
      GROUP BY g.id, g.base_word, g.status, g.created_at
    `);
    
    const game2 = await query(`
      SELECT 
        g.id,
        g.base_word,
        g.status,
        g.created_at,
        COUNT(gp.id) as player_count
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      WHERE g.id = '3f39c8c1-e3db-40c3-81f7-b1ced635a159'
      GROUP BY g.id, g.base_word, g.status, g.created_at
    `);
    
    console.log('Game 1 (eef0efc3-ff88-450f-8a2a-e9bff49ed235):', game1.rows);
    console.log('Game 2 (3f39c8c1-e3db-40c3-81f7-b1ced635a159):', game2.rows);
    
    // Check players for each game
    console.log('\n👥 Checking players for each game:');
    const players1 = await query(`
      SELECT * FROM game_players WHERE game_id = 'eef0efc3-ff88-450f-8a2a-e9bff49ed235'
    `);
    
    const players2 = await query(`
      SELECT * FROM game_players WHERE game_id = '3f39c8c1-e3db-40c3-81f7-b1ced635a159'
    `);
    
    console.log('Players for Game 1:', players1.rows);
    console.log('Players for Game 2:', players2.rows);
    
    // Delete the problematic games
    console.log('\n🗑️ Deleting problematic games...');
    const deleteResult1 = await query(`
      DELETE FROM games WHERE id = 'eef0efc3-ff88-450f-8a2a-e9bff49ed235'
    `);
    
    const deleteResult2 = await query(`
      DELETE FROM games WHERE id = '3f39c8c1-e3db-40c3-81f7-b1ced635a159'
    `);
    
    console.log('Delete results:', { game1: deleteResult1, game2: deleteResult2 });
    
    // Verify deletion
    console.log('\n✅ Verifying deletion...');
    const remainingGames = await query(`
      SELECT 
        g.id,
        g.base_word,
        g.status,
        g.created_at,
        COUNT(gp.id) as player_count
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      GROUP BY g.id, g.base_word, g.status, g.created_at
      ORDER BY g.created_at DESC
    `);
    
    console.log('Remaining games:', remainingGames.rows);
    
    console.log('\n🎉 Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupProblematicGames(); 