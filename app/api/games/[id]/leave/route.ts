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

    console.log('[Leave Game API] Player leaving game:', { gameId, userId });

    // Create a fresh database connection for this request
    const sql = neon(process.env.DATABASE_URL!)

    // Use a transaction to prevent race conditions
    await sql`BEGIN`

    try {
      // Find the player to see if they are the host
      const playerResult = await sql`
        SELECT is_host FROM game_players WHERE game_id = ${gameId} AND user_id = ${userId}
      `

      if (!playerResult || playerResult.length === 0) {
        await sql`ROLLBACK`
        return NextResponse.json({ error: 'Player not in game' }, { status: 404 });
      }
      
      const wasHost = playerResult[0].is_host;

      // Remove the player from the game
      const leaveResult = await sql`
        DELETE FROM game_players 
        WHERE game_id = ${gameId} AND user_id = ${userId}
        RETURNING id
      `

      if (!leaveResult || leaveResult.length === 0) {
        await sql`ROLLBACK`
        return NextResponse.json(
          { error: 'Player not found in game' },
          { status: 404 }
        )
      }

      // Check if the game is now empty
      const playerCountResult = await sql`
        SELECT COUNT(*) as count FROM game_players WHERE game_id = ${gameId}
      `

      const playerCount = parseInt(playerCountResult[0].count, 10)

      if (playerCount === 0) {
        // Delete the empty game
        await sql`DELETE FROM games WHERE id = ${gameId}`
        console.log('[Leave Game API] Deleted empty game:', gameId);
      } else if (wasHost) {
        // If the host left, make the next player the host.
        const nextHostResult = await sql`
          SELECT id FROM game_players 
          WHERE game_id = ${gameId} 
          ORDER BY joined_at ASC 
          LIMIT 1
        `

        if (nextHostResult && nextHostResult.length > 0) {
          const nextHostId = nextHostResult[0].id;
          await sql`
            UPDATE game_players
            SET is_host = true
            WHERE id = ${nextHostId}
          `
          console.log('[Leave Game API] Transferred host to player ID:', nextHostId);
        }
      }

      await sql`COMMIT`

      return NextResponse.json({ 
        success: true,
        gameDeleted: playerCount === 0
      })

    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }

  } catch (error) {
    console.error('Error in leave game:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 