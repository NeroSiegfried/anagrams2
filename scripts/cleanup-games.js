// Simple cleanup script to delete games with no players
import pg from 'pg';

const { Pool } = pg;

// Create a connection pool using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function cleanupGames() {
  const client = await pool.connect();
  
  try {
    console.log('Cleaning up games with no players...');
    
    // Delete games with no players
    const result = await client.query(`
      DELETE FROM games
      WHERE id IN (
        SELECT g.id
        FROM games g
        LEFT JOIN game_players gp ON g.id = gp.game_id
        WHERE gp.id IS NULL
      )
    `);
    
    console.log(`Deleted ${result.rowCount} games with no players.`);
    
    // Delete orphaned game_players rows
    const orphanResult = await client.query(`
      DELETE FROM game_players
      WHERE game_id NOT IN (SELECT id FROM games)
    `);
    
    console.log(`Deleted ${orphanResult.rowCount} orphaned game_players rows.`);
    
    // Show remaining games
    const remainingGames = await client.query(`
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
    
    console.log('\nRemaining games:');
    console.log('================');
    remainingGames.rows.forEach(game => {
      console.log(`ID: ${game.id}`);
      console.log(`Word: ${game.base_word}`);
      console.log(`Status: ${game.status}`);
      console.log(`Players: ${game.player_count}`);
      console.log(`Created: ${game.created_at}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupGames(); 