-- Create the pgvector extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS vector;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  is_multiplayer BOOLEAN DEFAULT false,
  base_word TEXT,
  letters TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 60,
  max_players INTEGER DEFAULT 1,
  game_code TEXT UNIQUE
);

-- Create game_participants table
CREATE TABLE IF NOT EXISTS game_participants (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  is_guest BOOLEAN DEFAULT false
);

-- Create scores table
CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  words_found INTEGER NOT NULL,
  words_list TEXT[] NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW(),
  is_guest BOOLEAN DEFAULT false
);

-- Create leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  best_score INTEGER NOT NULL,
  total_games INTEGER DEFAULT 1,
  total_words_found INTEGER DEFAULT 0,
  average_score DECIMAL(10,2) DEFAULT 0,
  last_played TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create words table
CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  word TEXT UNIQUE NOT NULL,
  length INTEGER NOT NULL,
  is_common BOOLEAN DEFAULT false,
  definition TEXT,
  canonical_form TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add canonical_form column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'words' AND column_name = 'canonical_form') THEN
        ALTER TABLE words ADD COLUMN canonical_form TEXT;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_length ON words(length);
CREATE INDEX IF NOT EXISTS idx_words_canonical_form ON words(canonical_form);
CREATE INDEX IF NOT EXISTS idx_games_code ON games(game_code);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_best_score ON leaderboards(best_score DESC);
