require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function checkGamesTableStructure() {
  console.log('Checking games table structure...')
  
  const sql = neon(process.env.DATABASE_URL)
  
  try {
    // Get table structure
    const result = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'games'
      ORDER BY ordinal_position
    `
    
    console.log('Games table structure:')
    result.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`)
    })
    
    // Get primary key info
    const pkResult = await sql`
      SELECT constraint_name, column_name
      FROM information_schema.key_column_usage
      WHERE table_name = 'games' AND constraint_name LIKE '%_pkey'
    `
    
    console.log('\nPrimary key:')
    pkResult.forEach(pk => {
      console.log(`  ${pk.constraint_name}: ${pk.column_name}`)
    })
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

checkGamesTableStructure() 