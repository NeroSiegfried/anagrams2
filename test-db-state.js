const { neon } = require('@neondatabase/serverless');

async function checkDatabase() {
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not set');
      return;
    }

    const sql = neon(process.env.DATABASE_URL);
    
    console.log('\n=== CHECKING GAMES TABLE ===');
    const games = await sql`SELECT id, base_word, status, created_at FROM games`;
    console.log('Games found:', games.length);
    games.forEach(game => {
      console.log(`- ${game.base_word} (${game.id}) - ${game.status}`);
    });

    console.log('\n=== CHECKING GAME_PLAYERS TABLE ===');
    const players = await sql`SELECT game_id, username FROM game_players`;
    console.log('Players found:', players.length);
    players.forEach(player => {
      console.log(`- ${player.username} in game ${player.game_id}`);
    });

    console.log('\n=== CHECKING USERS TABLE ===');
    const users = await sql`SELECT id, username FROM users LIMIT 5`;
    console.log('Users found:', users.length);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.id})`);
    });

  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase(); 