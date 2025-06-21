const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function checkPublicStatus() {
  try {
    console.log('=== CHECKING GAME PUBLIC STATUS ===');
    
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not set');
      return;
    }

    const sql = neon(process.env.DATABASE_URL);
    
    const games = await sql`SELECT id, base_word, is_public, status FROM games`;
    console.log('Games found:', games.length);
    
    games.forEach(game => {
      console.log(`- ${game.base_word} (${game.id})`);
      console.log(`  is_public: ${game.is_public}`);
      console.log(`  status: ${game.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPublicStatus(); 