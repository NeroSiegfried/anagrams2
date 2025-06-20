import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get public games that are waiting for players
    const result = await query(`
      SELECT 
        g.id,
        g.base_word,
        g.created_by,
        g.status,
        g.current_round,
        g.time_limit,
        g.max_players,
        g.created_at,
        COUNT(gp.id) as player_count
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      WHERE g.is_public = true AND g.status = 'waiting'
      GROUP BY g.id, g.base_word, g.created_by, g.status, g.current_round, g.time_limit, g.max_players, g.created_at
      ORDER BY g.created_at DESC
    `)

    if (!result || !result.rows) {
      return NextResponse.json(
        { error: 'Failed to fetch public games' },
        { status: 500 }
      )
    }

    // Get players for each game
    const gamesWithPlayers = await Promise.all(
      result.rows.map(async (game) => {
        const playersResult = await query(`
          SELECT id, user_id, username, score, is_host
          FROM game_players
          WHERE game_id = $1
        `, [game.id])

        return {
          ...game,
          game_players: playersResult?.rows || []
        }
      })
    )

    return NextResponse.json({ games: gamesWithPlayers })

  } catch (error) {
    console.error('Error in public games:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 