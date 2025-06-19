const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

async function setupDatabase() {
  try {
    console.log('Setting up database tables...')
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set')
      console.log('Please make sure your .env.local file contains the DATABASE_URL')
      process.exit(1)
    }

    console.log('Database URL found, connecting...')
    
    // Initialize neon connection
    const sql = neon(process.env.DATABASE_URL)
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-tables.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Executing ${statements.length} SQL statements...`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`)
          // Use sql.unsafe for raw SQL execution
          await sql.unsafe(statement)
        } catch (error) {
          // Some statements might fail if tables already exist, that's okay
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`Statement ${i + 1} skipped (already exists): ${error.message}`)
          } else {
            console.error(`Error executing statement ${i + 1}:`, error.message)
          }
        }
      }
    }
    
    console.log('Database tables created successfully!')
    
    // Test the connection
    const result = await sql`SELECT NOW() as current_time`
    console.log('Database connection test:', result[0])
    
  } catch (error) {
    console.error('Error setting up database:', error)
    process.exit(1)
  }
}

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

setupDatabase() 