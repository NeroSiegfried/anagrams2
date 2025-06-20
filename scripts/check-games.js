const { query } = require('../lib/db.js');

async function checkGames() {
  try {
    console.log('Checking games in database...\n');

    // Check all games
    const games = await query(`
      SELECT 
        g.id,
        g.base_word,
        g.status,
        g.created_at,
        g.started_at,
        g.is_public,
        COUNT(gp.id) as player_count
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      GROUP BY g.id, g.base_word, g.status, g.created_at, g.started_at, g.is_public
      ORDER BY g.created_at DESC
    `);

    console.log('All games in database:');
    console.log('======================');
    games.forEach(game => {
      console.log(`ID: ${game.id}`);
      console.log(`Word: ${game.base_word}`);
      console.log(`Status: ${game.status}`);
      console.log(`Players: ${game.player_count}`);
      console.log(`Created: ${game.created_at}`);
      console.log(`Started: ${game.started_at || 'Not started'}`);
      console.log(`Public: ${game.is_public}`);
      console.log('---');
    });

    // Check game players
    const players = await query(`
      SELECT 
        gp.id,
        gp.game_id,
        gp.user_id,
        gp.username,
        gp.score,
        gp.is_host,
        gp.ready,
        gp.joined_at
      FROM game_players gp
      ORDER BY gp.joined_at DESC
    `);

    console.log('\nAll game players:');
    console.log('=================');
    players.forEach(player => {
      console.log(`Player ID: ${player.id}`);
      console.log(`Game ID: ${player.game_id}`);
      console.log(`User ID: ${player.user_id}`);
      console.log(`Username: ${player.username}`);
      console.log(`Score: ${player.score}`);
      console.log(`Host: ${player.is_host}`);
      console.log(`Ready: ${player.ready}`);
      console.log(`Joined: ${player.joined_at}`);
      console.log('---');
    });

    // Count by status
    const statusCounts = await query(`
      SELECT 
        g.status,
        COUNT(*) as count
      FROM games g
      GROUP BY g.status
    `);

    console.log('\nGames by status:');
    console.log('================');
    statusCounts.forEach(status => {
      console.log(`${status.status}: ${status.count}`);
    });

  } catch (error) {
    console.error('Error checking games:', error);
  }
}

checkGames(); 