-- Create tables for Supabase (updated to handle missing auth schema)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  is_multiplayer BOOLEAN DEFAULT false,
  base_word TEXT,
  letters TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 60,
  max_players INTEGER DEFAULT 1,
  game_code TEXT UNIQUE
);

-- Create game_participants table (without auth.users reference initially)
CREATE TABLE IF NOT EXISTS public.game_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID, -- Will add foreign key constraint later if auth schema exists
  username TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_guest BOOLEAN DEFAULT false
);

-- Create scores table (without auth.users reference initially)
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID, -- Will add foreign key constraint later if auth schema exists
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  words_found INTEGER NOT NULL,
  words_list TEXT[] NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_guest BOOLEAN DEFAULT false
);

-- Create leaderboards table (without auth.users reference initially)
CREATE TABLE IF NOT EXISTS public.leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Will add foreign key constraint later if auth schema exists
  username TEXT NOT NULL,
  best_score INTEGER NOT NULL,
  total_games INTEGER DEFAULT 1,
  total_words_found INTEGER DEFAULT 0,
  average_score DECIMAL(10,2) DEFAULT 0,
  last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create words table
CREATE TABLE IF NOT EXISTS public.words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT UNIQUE NOT NULL,
  length INTEGER NOT NULL,
  is_common BOOLEAN DEFAULT false,
  definition TEXT,
  canonical_form TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_words_word ON public.words(word);
CREATE INDEX IF NOT EXISTS idx_words_length ON public.words(length);
CREATE INDEX IF NOT EXISTS idx_words_canonical_form ON public.words(canonical_form);
CREATE INDEX IF NOT EXISTS idx_games_code ON public.games(game_code);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_best_score ON public.leaderboards(best_score DESC);

-- Set up RLS (Row Level Security) policies
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;

-- Games policies
CREATE POLICY "Public games are viewable by everyone" 
ON public.games FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can create games" 
ON public.games FOR INSERT 
WITH CHECK (true);

-- Game participants policies
CREATE POLICY "Game participants are viewable by everyone" 
ON public.game_participants FOR SELECT 
USING (true);

CREATE POLICY "Users can join games" 
ON public.game_participants FOR INSERT 
WITH CHECK (true);

-- Scores policies
CREATE POLICY "Scores are viewable by everyone" 
ON public.scores FOR SELECT 
USING (true);

CREATE POLICY "Users can submit scores" 
ON public.scores FOR INSERT 
WITH CHECK (true);

-- Leaderboards policies
CREATE POLICY "Leaderboards are viewable by everyone" 
ON public.leaderboards FOR SELECT 
USING (true);

-- Words policies
CREATE POLICY "Words are viewable by everyone" 
ON public.words FOR SELECT 
USING (true);

-- Function to add foreign key constraints when auth schema becomes available
CREATE OR REPLACE FUNCTION add_auth_foreign_keys()
RETURNS void AS $$
BEGIN
  -- Check if auth.users table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    -- Add foreign key constraints to auth.users
    BEGIN
      ALTER TABLE public.game_participants 
      ADD CONSTRAINT fk_game_participants_user_id 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      -- Constraint already exists, ignore
    END;
    
    BEGIN
      ALTER TABLE public.scores 
      ADD CONSTRAINT fk_scores_user_id 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      -- Constraint already exists, ignore
    END;
    
    BEGIN
      ALTER TABLE public.leaderboards 
      ADD CONSTRAINT fk_leaderboards_user_id 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      -- Constraint already exists, ignore
    END;
    
    RAISE NOTICE 'Foreign key constraints to auth.users have been added successfully.';
  ELSE
    RAISE NOTICE 'auth.users table does not exist yet. Foreign key constraints will be added later.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Try to add foreign key constraints (will succeed if auth schema exists)
SELECT add_auth_foreign_keys();

-- Create function to update leaderboard on score submission
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip for guest users
  IF NEW.is_guest = true OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if user exists in leaderboard
  IF EXISTS (SELECT 1 FROM public.leaderboards WHERE user_id = NEW.user_id) THEN
    -- Update existing leaderboard entry
    UPDATE public.leaderboards
    SET 
      best_score = GREATEST(best_score, NEW.score),
      total_games = total_games + 1,
      total_words_found = total_words_found + NEW.words_found,
      average_score = (average_score * total_games + NEW.score) / (total_games + 1),
      last_played = NOW(),
      username = NEW.username
    WHERE user_id = NEW.user_id;
  ELSE
    -- Create new leaderboard entry
    INSERT INTO public.leaderboards 
      (user_id, username, best_score, total_games, total_words_found, average_score)
    VALUES 
      (NEW.user_id, NEW.username, NEW.score, 1, NEW.words_found, NEW.score);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update leaderboard on score submission
DROP TRIGGER IF EXISTS update_leaderboard_trigger ON public.scores;
CREATE TRIGGER update_leaderboard_trigger
AFTER INSERT ON public.scores
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard();
