import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { gameId, userId, username } = await request.json()
    
    console.log('[Join API] Received join request:', { gameId, userId, username });

    if (!gameId || !userId || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if game exists
    const gameResult = await query(`
      SELECT * FROM games 
      WHERE id = $1
    `, [gameId])

    if (!gameResult || !gameResult.rows || gameResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const game = gameResult.rows[0]

    // Check if player is already in the game
    const existingPlayerResult = await query(`
      SELECT id, username FROM game_players 
      WHERE game_id = $1 AND user_id = $2
    `, [gameId, userId])

    if (existingPlayerResult && existingPlayerResult.rows && existingPlayerResult.rows.length > 0) {
      // Player is already in the game, allow them to rejoin
      const existingPlayer = existingPlayerResult.rows[0]
      
      // Update their username if it changed
      if (existingPlayer.username !== username) {
        await query(`
          UPDATE game_players SET username = $1, updated_at = NOW()
          WHERE game_id = $2 AND user_id = $3
        `, [username, gameId, userId])
      }
      
      return NextResponse.json({ 
        success: true,
        gameId: gameId,
        rejoined: true
      })
    }

    // New player joining - only allow if game is in 'waiting' status
    if (game.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Game has already started' },
        { status: 400 }
      )
    }

    // Check if game is full
    const playersResult = await query(`
      SELECT id FROM game_players 
      WHERE game_id = $1
    `, [gameId])

    if (!playersResult || !playersResult.rows) {
      return NextResponse.json(
        { error: 'Failed to check game players' },
        { status: 500 }
      )
    }

    if (playersResult.rows.length >= game.max_players) {
      return NextResponse.json(
        { error: 'Game is full' },
        { status: 400 }
      )
    }

    // Add new player to game
    try {
      await query(`
        INSERT INTO game_players (game_id, user_id, username, score, is_host)
        VALUES ($1, $2, $3, $4, $5)
      `, [gameId, userId, username, 0, false])
    } catch (error) {
      console.error('Error joining game:', error)
      return NextResponse.json(
        { error: 'Failed to join game' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      gameId: gameId 
    })

  } catch (error) {
    console.error('Error in join game:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
