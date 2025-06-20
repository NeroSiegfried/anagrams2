import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id
    const { userId } = await request.json()

    if (!gameId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user is host
    const playerResult = await query(`
      SELECT is_host FROM game_players 
      WHERE game_id = $1 AND user_id = $2
    `, [gameId, userId])

    if (!playerResult || !playerResult.rows || playerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Player not found in game' },
        { status: 404 }
      )
    }

    const player = playerResult.rows[0]
    if (!player.is_host) {
      return NextResponse.json(
        { error: 'Only host can start the game' },
        { status: 403 }
      )
    }

    // Update game status to starting (not yet active)
    try {
      await query(`
        UPDATE games 
        SET status = 'starting', updated_at = NOW()
        WHERE id = $1
      `, [gameId])
    } catch (error) {
      console.error('Error starting game:', error)
      return NextResponse.json(
        { error: 'Failed to start game' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      status: 'starting'
    })

  } catch (error) {
    console.error('Error in start game:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 