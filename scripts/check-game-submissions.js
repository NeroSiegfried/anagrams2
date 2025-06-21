const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function checkGameSubmissions() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    return;
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Check if game_submissions table exists and has data
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'game_submissions'
      );
    `;
    
    console.log('Game submissions table exists:', tableCheck[0].exists);

    if (tableCheck[0].exists) {
      // Get all game submissions
      const submissions = await sql`
        SELECT * FROM game_submissions 
        ORDER BY submitted_at DESC 
        LIMIT 10
      `;
      
      console.log('Recent game submissions:', submissions);

      // Get submissions for a specific game
      const gameId = 'e043b9d7-02b0-492a-86ee-8810cf1fd595'; // From the logs
      const gameSubmissions = await sql`
        SELECT * FROM game_submissions 
        WHERE game_id = ${gameId}
        ORDER BY submitted_at DESC
      `;
      
      console.log(`Submissions for game ${gameId}:`, gameSubmissions);

      // Test the ARRAY_AGG query
      const foundWordsResult = await sql`
        SELECT 
          user_id,
          ARRAY_AGG(word) as found_words
        FROM game_submissions 
        WHERE game_id = ${gameId}
        GROUP BY user_id
      `;
      
      console.log('Found words result:', foundWordsResult);
    }

  } catch (error) {
    console.error('Error checking game submissions:', error);
  }
}

checkGameSubmissions(); 