import { query } from './lib/db.js';

async function listActiveGames() {
  try {
    console.log('Fetching active games and players...');
    
    const gamesResult = await query(`
      SELECT g.id as game_id, g.status, p.user_id, p.username, p.is_host, p.ready
      FROM games g
      JOIN game_players p ON g.id = p.game_id
      WHERE g.status = 'waiting'
      ORDER BY g.created_at DESC, p.joined_at ASC;
    `);

    if (gamesResult.rows.length === 0) {
      console.log('No "waiting" games found.');
      return;
    }

    console.log('Found waiting games:');
    console.table(gamesResult.rows);

  } catch (error) {
    console.error('Error fetching games:', error);
  }
}

listActiveGames(); 