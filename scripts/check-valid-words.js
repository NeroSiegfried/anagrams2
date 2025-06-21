require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function checkValidWords() {
  try {
    console.log('🔍 Checking valid_words in recent games...');
    
    const sql = neon(process.env.DATABASE_URL);
    
    // Get recent games with their valid_words
    const games = await sql`
      SELECT 
        id, 
        base_word, 
        status, 
        valid_words,
        created_at,
        started_at
      FROM games 
      WHERE created_at > NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    console.log(`\n📊 Found ${games.length} recent games:`);
    
    games.forEach((game, index) => {
      console.log(`\n${index + 1}. Game ${game.id}:`);
      console.log(`   Base word: ${game.base_word}`);
      console.log(`   Status: ${game.status}`);
      console.log(`   Created: ${game.created_at}`);
      console.log(`   Started: ${game.started_at || 'Not started'}`);
      
      if (game.valid_words) {
        if (Array.isArray(game.valid_words)) {
          console.log(`   ✅ Valid words: ${game.valid_words.length} words`);
          if (game.valid_words.length > 0) {
            console.log(`   Sample words: ${game.valid_words.slice(0, 5).join(', ')}${game.valid_words.length > 5 ? '...' : ''}`);
          }
        } else {
          console.log(`   ⚠️  Valid words: Not an array (${typeof game.valid_words})`);
          console.log(`   Content: ${JSON.stringify(game.valid_words).substring(0, 100)}...`);
        }
      } else {
        console.log(`   ❌ Valid words: NULL or undefined`);
      }
    });
    
    // Check if any games have valid_words
    const gamesWithValidWords = games.filter(g => g.valid_words && Array.isArray(g.valid_words) && g.valid_words.length > 0);
    console.log(`\n📈 Summary:`);
    console.log(`   Total recent games: ${games.length}`);
    console.log(`   Games with valid_words: ${gamesWithValidWords.length}`);
    console.log(`   Games without valid_words: ${games.length - gamesWithValidWords.length}`);
    
    if (gamesWithValidWords.length > 0) {
      const totalWords = gamesWithValidWords.reduce((sum, game) => sum + game.valid_words.length, 0);
      const avgWords = Math.round(totalWords / gamesWithValidWords.length);
      console.log(`   Average valid words per game: ${avgWords}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking valid words:', error);
  }
}

checkValidWords(); 