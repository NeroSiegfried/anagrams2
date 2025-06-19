import { query } from "@/lib/db"

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

// Multiplayer functionality disabled - running in guest mode
export async function createGame(
  letters: string,
  baseWord: string | null,
  isMultiplayer = false,
  durationSeconds = 60,
  maxPlayers = 1,
): Promise<Game> {
  // Guest mode - return mock game data
  return {
    id: Math.random().toString(36).substring(2, 9),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
    is_multiplayer: false,
    base_word: baseWord,
    letters,
    duration_seconds: durationSeconds,
    max_players: maxPlayers,
    game_code: null,
  }
}

export async function getGameById(gameId: string): Promise<Game | null> {
  // Guest mode - return null
  return null
}

export async function getGameByCode(gameCode: string): Promise<Game | null> {
  // Guest mode - return null
  return null
}

export async function joinGame(
  gameId: string,
  username: string,
  userId: string | null = null,
): Promise<GameParticipant> {
  // Guest mode - return mock participant
  return {
    id: Math.random().toString(36).substring(2, 9),
    game_id: gameId,
    user_id: null,
    username,
    joined_at: new Date().toISOString(),
    left_at: null,
    is_guest: true,
  }
}

export async function leaveGame(gameId: string, username: string): Promise<GameParticipant | null> {
  // Guest mode - return null
  return null
}

export async function getGameParticipants(gameId: string): Promise<GameParticipant[]> {
  // Guest mode - return empty array
  return []
}

export async function submitScore(
  gameId: string,
  username: string,
  score: number,
  wordsFound: number,
  wordsList: string[],
  userId: string | null = null,
): Promise<Score> {
  // Guest mode - return mock score
  return {
    id: Math.random().toString(36).substring(2, 9),
    game_id: gameId,
    user_id: null,
    username,
    score,
    words_found: wordsFound,
    words_list: wordsList,
    completed_at: new Date().toISOString(),
    is_guest: true,
  }
}

export async function getScoresByGameId(gameId: string): Promise<Score[]> {
  // Guest mode - return empty array
  return []
}

export async function getUserScores(userId: string, limit = 10): Promise<Score[]> {
  // Guest mode - return empty array
  return []
}

export async function getTopScores(limit = 10): Promise<Score[]> {
  // Guest mode - return empty array
  return []
}

export async function getLeaderboard(limit = 10): Promise<any[]> {
  // Guest mode - return empty array
  return []
}

function generateGameCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}
