import { query } from "@/lib/db"
import { neon } from '@neondatabase/serverless'

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
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Insert the score into the database - match the actual Supabase table schema
    const result = await sql`
      INSERT INTO scores (game_id, user_id, username, score, words_found, words_list, completed_at, is_guest)
      VALUES (${gameId}, ${userId}, ${username}, ${score}, ${wordsFound}, ${wordsList}, NOW(), ${!userId})
      RETURNING id, game_id, user_id, username, score, words_found, words_list, completed_at, is_guest
    `
    
    if (result && result.length > 0) {
      const savedScore = result[0]
      console.log('[Game Service] Score saved successfully:', { gameId, username, score, wordsFound })
      return {
        id: savedScore.id,
        game_id: savedScore.game_id,
        user_id: savedScore.user_id,
        username: savedScore.username,
        score: savedScore.score,
        words_found: savedScore.words_found,
        words_list: savedScore.words_list || [],
        completed_at: savedScore.completed_at,
        is_guest: savedScore.is_guest
      }
    } else {
      throw new Error('Failed to save score to database')
    }
  } catch (error) {
    console.error('[Game Service] Error saving score:', error)
    // Fallback to mock score if database save fails
    return {
      id: Math.random().toString(36).substring(2, 9),
      game_id: gameId,
      user_id: userId,
      username,
      score,
      words_found: wordsFound,
      words_list: wordsList,
      completed_at: new Date().toISOString(),
      is_guest: !userId,
    }
  }
}

export async function getScoresByGameId(gameId: string): Promise<Score[]> {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    const result = await sql`
      SELECT 
        s.id, 
        s.game_id, 
        s.user_id, 
        s.username,
        s.score, 
        s.words_found, 
        s.words_list,
        s.completed_at,
        s.is_guest
      FROM scores s
      WHERE s.game_id = ${gameId}
      ORDER BY s.score DESC, s.completed_at ASC
    `
    
    return result.map(row => ({
      id: row.id,
      game_id: row.game_id,
      user_id: row.user_id,
      username: row.username || 'Guest',
      score: row.score,
      words_found: row.words_found,
      words_list: row.words_list || [],
      completed_at: row.completed_at,
      is_guest: row.is_guest
    }))
  } catch (error) {
    console.error('[Game Service] Error getting scores:', error)
    return []
  }
}

export async function getUserScores(userId: string, limit = 10): Promise<Score[]> {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    const result = await sql`
      SELECT 
        s.id, 
        s.game_id, 
        s.user_id, 
        s.username,
        s.score, 
        s.words_found, 
        s.words_list,
        s.completed_at,
        s.is_guest
      FROM scores s
      WHERE s.user_id = ${userId}
      ORDER BY s.score DESC, s.completed_at DESC
      LIMIT ${limit}
    `
    
    return result.map(row => ({
      id: row.id,
      game_id: row.game_id,
      user_id: row.user_id,
      username: row.username || 'Guest',
      score: row.score,
      words_found: row.words_found,
      words_list: row.words_list || [],
      completed_at: row.completed_at,
      is_guest: row.is_guest
    }))
  } catch (error) {
    console.error('[Game Service] Error getting user scores:', error)
    return []
  }
}

export async function getTopScores(limit = 10): Promise<Score[]> {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    const result = await sql`
      SELECT 
        s.id, 
        s.game_id, 
        s.user_id, 
        s.username,
        s.score, 
        s.words_found, 
        s.words_list,
        s.completed_at,
        s.is_guest
      FROM scores s
      ORDER BY s.score DESC, s.completed_at ASC
      LIMIT ${limit}
    `
    
    return result.map(row => ({
      id: row.id,
      game_id: row.game_id,
      user_id: row.user_id,
      username: row.username || 'Guest',
      score: row.score,
      words_found: row.words_found,
      words_list: row.words_list || [],
      completed_at: row.completed_at,
      is_guest: row.is_guest
    }))
  } catch (error) {
    console.error('[Game Service] Error getting top scores:', error)
    return []
  }
}

export async function getLeaderboard(limit = 10): Promise<any[]> {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    const result = await sql`
      SELECT 
        s.username,
        COUNT(*) as games_played,
        AVG(s.score) as avg_score,
        MAX(s.score) as best_score,
        SUM(s.score) as total_score
      FROM scores s
      WHERE s.user_id IS NOT NULL AND s.is_guest = false
      GROUP BY s.username
      ORDER BY total_score DESC, avg_score DESC
      LIMIT ${limit}
    `
    
    return result.map(row => ({
      username: row.username || 'Guest',
      games_played: row.games_played,
      avg_score: Math.round(row.avg_score),
      best_score: row.best_score,
      total_score: row.total_score
    }))
  } catch (error) {
    console.error('[Game Service] Error getting leaderboard:', error)
    return []
  }
}

function generateGameCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}
