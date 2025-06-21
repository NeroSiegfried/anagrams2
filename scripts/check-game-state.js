import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkGameState() {
  try {
    console.log('Checking current game state...');
    
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not set');
      return;
    }
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Check all games with their players
    console.log('\n=== Games with Players ===');
    const gamesWithPlayers = await sql`
      SELECT 
        g.id,
        g.base_word,
        g.created_by,
        g.status,
        g.is_public,
        gp.user_id,
        gp.username,
        gp.is_host,
        gp.ready
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      ORDER BY g.created_at DESC, gp.joined_at ASC
    `;
    
    // Group by game
    const gameMap = new Map();
    gamesWithPlayers.forEach(row => {
      if (!gameMap.has(row.id)) {
        gameMap.set(row.id, {
          id: row.id,
          base_word: row.base_word,
          created_by: row.created_by,
          status: row.status,
          is_public: row.is_public,
          players: []
        });
      }
      if (row.user_id) {
        gameMap.get(row.id).players.push({
          user_id: row.user_id,
          username: row.username,
          is_host: row.is_host,
          ready: row.ready
        });
      }
    });
    
    gameMap.forEach((game, gameId) => {
      console.log(`\nGame: ${gameId}`);
      console.log(`  Base word: ${game.base_word}`);
      console.log(`  Created by: ${game.created_by}`);
      console.log(`  Status: ${game.status}`);
      console.log(`  Public: ${game.is_public}`);
      console.log(`  Players (${game.players.length}):`);
      game.players.forEach(player => {
        console.log(`    - ${player.username} (${player.user_id}) - Host: ${player.is_host}, Ready: ${player.ready}`);
      });
    });
    
  } catch (error) {
    console.error('Check failed:', error);
  }
}

checkGameState(); 