const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function addDisplayNameColumn() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      process.exit(1);
    }
    const sql = neon(process.env.DATABASE_URL);
    console.log('Adding display_name column to users table if not exists...');
    await sql.unsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;');
    console.log('display_name column added or already exists.');
  } catch (error) {
    console.error('Error adding display_name column:', error);
    process.exit(1);
  }
}

addDisplayNameColumn(); 