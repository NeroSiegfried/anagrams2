import { getSupabaseClient } from "@/lib/supabase"

export interface Game {
  id: string
  created_at: string
  updated_at: string
  is_active: boolean
  is_multiplayer: boolean
  base_word: string | null
  letters: string
  duration_seconds: number
  max_players: number
  game_code: string | null
}

export interface GameParticipant {
  id: string
  game_id: string
  user_id: string | null
  username: string
  joined_at: string
  left_at: string | null
  is_guest: boolean
}

export interface Score {
  id: string
  game_id: string
  user_id: string | null
  username: string
  score: number
  words_found: number
  words_list: string[]
  completed_at: string
  is_guest: boolean
}

export async function createGame(
  letters: string,
  baseWord: string | null,
  isMultiplayer = false,
  durationSeconds = 60,
  maxPlayers = 1,
): Promise<Game> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    throw new Error("Supabase client not available")
  }

  const gameCode = isMultiplayer ? generateGameCode() : null

  const { data, error } = await supabase
    .from("games")
    .insert({
      letters,
      base_word: baseWord,
      is_multiplayer: isMultiplayer,
      duration_seconds: durationSeconds,
      max_players: maxPlayers,
      game_code: gameCode,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function getGameById(gameId: string): Promise<Game | null> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.from("games").select("*").eq("id", gameId).single()

  if (error) {
    console.error("Error fetching game:", error)
    return null
  }

  return data
}

export async function getGameByCode(gameCode: string): Promise<Game | null> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("game_code", gameCode)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error("Error fetching game by code:", error)
    return null
  }

  return data
}

export async function joinGame(
  gameId: string,
  username: string,
  userId: string | null = null,
): Promise<GameParticipant> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    throw new Error("Supabase client not available")
  }

  const isGuest = userId === null

  const { data, error } = await supabase
    .from("game_participants")
    .insert({
      game_id: gameId,
      user_id: userId,
      username,
      is_guest: isGuest,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function leaveGame(gameId: string, username: string): Promise<GameParticipant | null> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from("game_participants")
    .update({ left_at: new Date().toISOString() })
    .eq("game_id", gameId)
    .eq("username", username)
    .is("left_at", null)
    .select()
    .single()

  if (error) {
    console.error("Error leaving game:", error)
    return null
  }

  return data
}

export async function getGameParticipants(gameId: string): Promise<GameParticipant[]> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase.from("game_participants").select("*").eq("game_id", gameId)

  if (error) {
    console.error("Error fetching game participants:", error)
    return []
  }

  return data || []
}

export async function submitScore(
  gameId: string,
  username: string,
  score: number,
  wordsFound: number,
  wordsList: string[],
  userId: string | null = null,
): Promise<Score> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    throw new Error("Supabase client not available")
  }

  const isGuest = userId === null

  const { data, error } = await supabase
    .from("scores")
    .insert({
      game_id: gameId,
      user_id: userId,
      username,
      score,
      words_found: wordsFound,
      words_list: wordsList,
      is_guest: isGuest,
    })
    .select()
    .single()

  if (error) throw error

  return data
}

export async function getScoresByGameId(gameId: string): Promise<Score[]> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("game_id", gameId)
    .order("score", { ascending: false })

  if (error) {
    console.error("Error fetching scores by game ID:", error)
    return []
  }

  return data || []
}

export async function getUserScores(userId: string, limit = 10): Promise<Score[]> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching user scores:", error)
    return []
  }

  return data || []
}

export async function getTopScores(limit = 10): Promise<Score[]> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("is_guest", false)
    .order("score", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching top scores:", error)
    return []
  }

  return data || []
}

export async function getLeaderboard(limit = 10): Promise<any[]> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from("leaderboards")
    .select("*")
    .order("best_score", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching leaderboard:", error)
    return []
  }

  return data || []
}

function generateGameCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed confusing characters like 0, O, 1, I
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}
