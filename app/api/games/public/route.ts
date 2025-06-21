import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    require('dotenv').config({ path: '.env.local' })
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }
    
    // Create a fresh database connection for each request
    const sql = neon(process.env.DATABASE_URL)

    // Directly query all games and all players
    const games = await sql`SELECT id, base_word, is_public, status, created_by, current_round, time_limit, max_players, created_at FROM games`
    const players = await sql`SELECT game_id, username, score FROM game_players ORDER BY score DESC`

    // In-memory filter: public, waiting, at least one player
    const publicGames = games.filter(game => {
      if (!game.is_public || game.status !== 'waiting') return false
      const playerCount = players.filter(p => p.game_id === game.id).length
      return playerCount > 0 && playerCount < game.max_players
    }).map(game => {
      const gamePlayers = players.filter(p => p.game_id === game.id)
      const playerCount = gamePlayers.length
      return {
        ...game,
        player_count: playerCount,
        available_slots: game.max_players - playerCount,
        players: gamePlayers // Include player information with scores
      }
    })

    // Add cache-busting headers to prevent browser caching
    const response = NextResponse.json({ games: publicGames })
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('[Public Games API] Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
} 