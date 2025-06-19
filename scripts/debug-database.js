const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function debugDatabase() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      process.exit(1);
    }
    
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    const sql = neon(process.env.DATABASE_URL);
    
    // Check if users table exists and get its columns
    console.log('\nChecking users table structure...');
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `;
    
    console.log('Users table columns:');
    if (Array.isArray(columns)) {
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
    } else {
      console.log('Columns result:', columns);
    }
    
    // Check if display_name column exists specifically
    const displayNameExists = Array.isArray(columns) && columns.some(col => col.column_name === 'display_name');
    console.log(`\ndisplay_name column exists: ${displayNameExists}`);
    
    if (!displayNameExists) {
      console.log('\nAdding display_name column...');
      await sql`ALTER TABLE users ADD COLUMN display_name TEXT;`;
      console.log('display_name column added successfully.');
    }
    
  } catch (error) {
    console.error('Error debugging database:', error);
    process.exit(1);
  }
}

debugDatabase(); 