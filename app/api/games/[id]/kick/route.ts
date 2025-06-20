import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id
    const { userId, targetUserId } = await request.json()

    if (!gameId || !userId || !targetUserId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user is host
    const hostResult = await query(`
      SELECT is_host FROM game_players 
      WHERE game_id = $1 AND user_id = $2
    `, [gameId, userId])

    if (!hostResult || !hostResult.rows || hostResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Player not found in game' },
        { status: 404 }
      )
    }

    const host = hostResult.rows[0]
    if (!host.is_host) {
      return NextResponse.json(
        { error: 'Only host can kick players' },
        { status: 403 }
      )
    }

    // Check if target player exists and is not the host
    const targetResult = await query(`
      SELECT id, is_host, score FROM game_players 
      WHERE game_id = $1 AND user_id = $2
    `, [gameId, targetUserId])

    if (!targetResult || !targetResult.rows || targetResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Target player not found in game' },
        { status: 404 }
      )
    }

    const target = targetResult.rows[0]
    if (target.is_host) {
      return NextResponse.json(
        { error: 'Cannot kick the host' },
        { status: 400 }
      )
    }

    // Check if game is in waiting status
    const gameResult = await query(`
      SELECT status FROM games WHERE id = $1
    `, [gameId])

    if (!gameResult || !gameResult.rows || gameResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const game = gameResult.rows[0]
    if (game.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Can only kick players when game is in waiting status' },
        { status: 400 }
      )
    }

    // Store the player's score before removing them
    const playerScore = target.score

    // Remove the player from the game
    await query(`
      DELETE FROM game_players 
      WHERE game_id = $1 AND user_id = $2
    `, [gameId, targetUserId])

    // Check if any players remain
    const remainingPlayersResult = await query(`
      SELECT COUNT(*) as count FROM game_players WHERE game_id = $1
    `, [gameId])

    const remainingCount = parseInt(remainingPlayersResult.rows[0].count)

    let gameDeleted = false
    if (remainingCount === 0) {
      // Delete the game if no players remain
      await query(`
        DELETE FROM games WHERE id = $1
      `, [gameId])
      gameDeleted = true
    }

    return NextResponse.json({ 
      success: true,
      kickedPlayerScore: playerScore,
      gameDeleted
    })

  } catch (error) {
    console.error('Error in kick endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 