import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

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

    // Create a fresh database connection for this request
    const sql = neon(process.env.DATABASE_URL!)

    // Use a transaction to prevent race conditions
    await sql`BEGIN`

    try {
      // Check if game exists
      const gameResult = await sql`
        SELECT * FROM games 
        WHERE id = ${gameId}
      `

      if (!gameResult || gameResult.length === 0) {
        await sql`ROLLBACK`
        return NextResponse.json(
          { error: 'Game not found' },
          { status: 404 }
        )
      }

      const game = gameResult[0]

      // Check if player is already in the game
      const existingPlayerResult = await sql`
        SELECT id, username FROM game_players 
        WHERE game_id = ${gameId} AND user_id = ${userId}
      `

      if (existingPlayerResult && existingPlayerResult.length > 0) {
        // Player is already in the game, allow them to rejoin
        const existingPlayer = existingPlayerResult[0]
        
        // Update their username if it changed
        if (existingPlayer.username !== username) {
          await sql`
            UPDATE game_players SET username = ${username}, updated_at = NOW()
            WHERE game_id = ${gameId} AND user_id = ${userId}
          `
        }
        
        await sql`COMMIT`
        return NextResponse.json({ 
          success: true,
          gameId: gameId,
          rejoined: true
        })
      }

      // New player joining - only allow if game is in 'waiting' status
      if (game.status !== 'waiting') {
        await sql`ROLLBACK`
        return NextResponse.json(
          { error: 'Game has already started' },
          { status: 400 }
        )
      }

      // Check if game is full (within transaction)
      const playersResult = await sql`
        SELECT id FROM game_players 
        WHERE game_id = ${gameId}
      `

      if (playersResult.length >= game.max_players) {
        await sql`ROLLBACK`
        return NextResponse.json(
          { error: 'Game is full' },
          { status: 400 }
        )
      }

      // Add new player to game
      await sql`
        INSERT INTO game_players (game_id, user_id, username, score, is_host)
        VALUES (${gameId}, ${userId}, ${username}, 0, false)
      `

      await sql`COMMIT`

      return NextResponse.json({ 
        success: true,
        gameId: gameId 
      })

    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }

  } catch (error) {
    console.error('Error in join game:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
