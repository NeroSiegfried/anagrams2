require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function addValidWordsColumn() {
  console.log('Adding valid_words column to games table...')
  
  const sql = neon(process.env.DATABASE_URL)
  
  try {
    // Add the valid_words column as JSONB to store the pre-computed valid words
    await sql`
      ALTER TABLE games 
      ADD COLUMN IF NOT EXISTS valid_words JSONB DEFAULT '[]'::jsonb
    `
    
    console.log('✅ Successfully added valid_words column to games table')
    
    // Verify the column was added
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'games' AND column_name = 'valid_words'
    `
    
    if (result.length > 0) {
      console.log('✅ Column verification successful:', result[0])
    } else {
      console.log('❌ Column verification failed')
    }
    
  } catch (error) {
    console.error('❌ Error adding valid_words column:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

addValidWordsColumn() 