require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function createGameSubmissionsTable() {
  console.log('Creating game_submissions table...')
  
  const sql = neon(process.env.DATABASE_URL)
  
  try {
    // Create the game_submissions table
    await sql`
      CREATE TABLE IF NOT EXISTS game_submissions (
        id TEXT DEFAULT (gen_random_uuid())::text PRIMARY KEY,
        game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        word TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Ensure a player can't submit the same word twice in the same game
        UNIQUE(game_id, user_id, word)
      )
    `
    
    console.log('✅ Successfully created game_submissions table')
    
    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_game_submissions_game_id ON game_submissions(game_id)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_game_submissions_user_id ON game_submissions(user_id)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_game_submissions_submitted_at ON game_submissions(submitted_at)
    `
    
    console.log('✅ Successfully created indexes for game_submissions table')
    
    // Verify the table was created
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'game_submissions'
    `
    
    if (result.length > 0) {
      console.log('✅ Table verification successful:', result[0])
    } else {
      console.log('❌ Table verification failed')
    }
    
  } catch (error) {
    console.error('❌ Error creating game_submissions table:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

createGameSubmissionsTable() 