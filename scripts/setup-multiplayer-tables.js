const { neon } = require('@neondatabase/serverless')

async function setupMultiplayerTables() {
  console.log('Setting up multiplayer tables...')

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set')
    return
  }

  const sql = neon(process.env.DATABASE_URL)

  try {
    // Drop tables if they exist (to fix schema mismatches)
    await sql`DROP TABLE IF EXISTS game_players CASCADE`;
    await sql`DROP TABLE IF EXISTS game_words CASCADE`;
    await sql`DROP TABLE IF EXISTS games CASCADE`;

    // Create games table
    await sql`
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        base_word TEXT NOT NULL,
        created_by TEXT REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'starting', 'active', 'finished')),
        current_round INTEGER DEFAULT 1,
        time_limit INTEGER DEFAULT 120,
        max_players INTEGER DEFAULT 4,
        is_public BOOLEAN DEFAULT true,
        started_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log('✅ Games table created')

    // Create game_players table
    await sql`
      CREATE TABLE IF NOT EXISTS game_players (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        username TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        found_words TEXT[] DEFAULT '{}',
        is_host BOOLEAN DEFAULT false,
        ready BOOLEAN DEFAULT false,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(game_id, user_id)
      )
    `
    console.log('✅ Game players table created')

    // Create game_words table for tracking found words
    await sql`
      CREATE TABLE IF NOT EXISTS game_words (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        word TEXT NOT NULL,
        score INTEGER NOT NULL,
        found_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(game_id, user_id, word)
      )
    `
    console.log('✅ Game words table created')

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_games_status ON games(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_games_public ON games(is_public, status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON game_players(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_game_words_game_id ON game_words(game_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_game_words_user_id ON game_words(user_id)`

    console.log('✅ Indexes created')

    console.log('✅ Multiplayer tables created successfully!')
    console.log('Tables created:')
    console.log('- games')
    console.log('- game_players') 
    console.log('- game_words')
    console.log('Indexes created for performance optimization')

  } catch (error) {
    console.error('Error setting up multiplayer tables:', error)
  }
}

// Run the setup
setupMultiplayerTables() 