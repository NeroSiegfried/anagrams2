import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    // Ensure environment variables are loaded
    if (process.env.NODE_ENV !== 'production') {
      require('dotenv').config({ path: '.env.local' })
    }
    
    if (!process.env.DATABASE_URL) {
      console.error('[Public Games API] DATABASE_URL not set')
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }
    
    // Create a fresh database connection for each request
    const sql = neon(process.env.DATABASE_URL)
    
    console.log('[Public Games API] Fetching public games...')

    // Use a more efficient query that filters at the database level
    const publicGames = await sql`
      SELECT 
        g.id,
        g.base_word,
        g.is_public,
        g.status,
        g.created_by,
        g.current_round,
        g.time_limit,
        g.max_players,
        g.created_at,
        COUNT(gp.id) as player_count,
        g.max_players - COUNT(gp.id) as available_slots
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      WHERE g.is_public = true 
        AND g.status = 'waiting'
      GROUP BY g.id, g.base_word, g.is_public, g.status, g.created_by, 
               g.current_round, g.time_limit, g.max_players, g.created_at
      HAVING COUNT(gp.id) > 0 AND COUNT(gp.id) < g.max_players
      ORDER BY g.created_at DESC
      LIMIT 20
    `

    console.log(`[Public Games API] Found ${publicGames.length} public games`)

    // For each game, fetch the player details
    const gamesWithPlayers = await Promise.all(
      publicGames.map(async (game) => {
        try {
          const players = await sql`
            SELECT username, score 
            FROM game_players 
            WHERE game_id = ${game.id}
            ORDER BY score DESC
          `
          
          return {
            ...game,
            players: players || []
          }
        } catch (error) {
          console.error(`[Public Games API] Error fetching players for game ${game.id}:`, error)
          return {
            ...game,
            players: []
          }
        }
      })
    )

    // Add cache-busting headers to prevent browser caching
    const response = NextResponse.json({ 
      games: gamesWithPlayers,
      timestamp: Date.now(),
      count: gamesWithPlayers.length
    })
    
    // Aggressive cache prevention for deployment
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    console.log(`[Public Games API] Returning ${gamesWithPlayers.length} games`)
    return response
    
  } catch (error) {
    console.error('[Public Games API] Error:', error)
    
    // Return a more detailed error response for debugging
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: String(error),
      timestamp: Date.now()
    }, { status: 500 })
  }
} 