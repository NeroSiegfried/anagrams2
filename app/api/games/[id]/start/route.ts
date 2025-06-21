import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

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

    // Create a fresh database connection for this request
    const sql = neon(process.env.DATABASE_URL!)

    // Use a transaction to prevent race conditions
    await sql`BEGIN`

    try {
      // Check if user is host
      const playerResult = await sql`
        SELECT is_host FROM game_players 
        WHERE game_id = ${gameId} AND user_id = ${userId}
      `

      if (!playerResult || playerResult.length === 0) {
        await sql`ROLLBACK`
        return NextResponse.json(
          { error: 'Player not found in game' },
          { status: 404 }
        )
      }

      const player = playerResult[0]
      if (!player.is_host) {
        await sql`ROLLBACK`
        return NextResponse.json(
          { error: 'Only host can start the game' },
          { status: 403 }
        )
      }

      // Check if game is in waiting status
      const gameResult = await sql`
        SELECT status FROM games WHERE id = ${gameId}
      `

      if (!gameResult || gameResult.length === 0) {
        await sql`ROLLBACK`
        return NextResponse.json(
          { error: 'Game not found' },
          { status: 404 }
        )
      }

      const game = gameResult[0]
      if (game.status !== 'waiting') {
        await sql`ROLLBACK`
        return NextResponse.json(
          { error: 'Game is not in waiting status' },
          { status: 400 }
        )
      }

      // Check if there's at least one non-host player and all non-host players are ready
      const playerCountResult = await sql`
        SELECT 
          COUNT(*) AS total_players,
          COUNT(CASE WHEN is_host = false THEN 1 END) AS non_host_players,
          COUNT(CASE WHEN is_host = false AND ready = false THEN 1 END) AS not_ready_non_host
        FROM game_players
        WHERE game_id = ${gameId}
      `

      const { total_players, non_host_players, not_ready_non_host } = playerCountResult[0]
      
      if (parseInt(total_players) < 2) {
        await sql`ROLLBACK`
        return NextResponse.json(
          { error: 'At least 2 players are required to start the game' },
          { status: 400 }
        )
      }
      
      if (parseInt(non_host_players) === 0) {
        await sql`ROLLBACK`
        return NextResponse.json(
          { error: 'At least one other player must join before starting the game' },
          { status: 400 }
        )
      }
      
      if (parseInt(not_ready_non_host) > 0) {
        await sql`ROLLBACK`
        return NextResponse.json(
          { error: 'All players must be ready to start the game' },
          { status: 400 }
        )
      }

      // Update game status to active and set started_at
      await sql`
        UPDATE games 
        SET status = 'active', started_at = NOW(), updated_at = NOW()
        WHERE id = ${gameId}
      `

      await sql`COMMIT`

      return NextResponse.json({ 
        success: true,
        status: 'active'
      })

    } catch (error) {
      await sql`ROLLBACK`
      console.error('Error in start game transaction:', error)
      return NextResponse.json(
        { error: 'Failed to start game' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in start game:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 