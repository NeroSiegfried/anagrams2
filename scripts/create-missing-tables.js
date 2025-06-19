const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function createMissingTables() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set');
      process.exit(1);
    }
    
    console.log('Creating missing tables...');
    const sql = neon(process.env.DATABASE_URL);
    
    // Create user_preferences table
    console.log('Creating user_preferences table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        letter_count INTEGER DEFAULT 6,
        round_duration INTEGER DEFAULT 60,
        sound_enabled BOOLEAN DEFAULT true,
        music_enabled BOOLEAN DEFAULT true,
        theme TEXT DEFAULT 'light',
        language TEXT DEFAULT 'en',
        notifications BOOLEAN DEFAULT true
      );
    `;
    
    // Create sessions table if it doesn't exist
    console.log('Creating sessions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        session_token TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL
      );
    `;
    
    // Create accounts table if it doesn't exist (for future OAuth)
    console.log('Creating accounts table...');
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        UNIQUE(provider, provider_account_id)
      );
    `;
    
    // Create verification_tokens table if it doesn't exist
    console.log('Creating verification_tokens table...');
    await sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (identifier, token)
      );
    `;
    
    console.log('All missing tables created successfully!');
    
    // List all tables to verify
    console.log('\nVerifying tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('Available tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('Error creating missing tables:', error);
    process.exit(1);
  }
}

createMissingTables(); 