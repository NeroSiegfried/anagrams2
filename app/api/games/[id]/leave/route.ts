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

    console.log('[Leave Game API] Player leaving game:', { gameId, userId });

    // Find the player to see if they are the host
    const playerResult = await query(`
      SELECT is_host FROM game_players WHERE game_id = $1 AND user_id = $2
    `, [gameId, userId]);

    if (!playerResult.rows[0]) {
      return NextResponse.json({ error: 'Player not in game' }, { status: 404 });
    }
    const wasHost = playerResult.rows[0].is_host;

    // Remove the player from the game
    const leaveResult = await query(`
      DELETE FROM game_players 
      WHERE game_id = $1 AND user_id = $2
      RETURNING id
    `, [gameId, userId])

    if (!leaveResult || !leaveResult.rows || leaveResult.rows.length === 0) {
      // This case should be handled by the check above, but as a safeguard:
      return NextResponse.json(
        { error: 'Player not found in game' },
        { status: 404 }
      )
    }

    // Check if the game is now empty
    const playerCountResult = await query(`
      SELECT COUNT(*) as count FROM game_players WHERE game_id = $1
    `, [gameId])

    const playerCount = parseInt(playerCountResult.rows[0].count, 10)

    if (playerCount === 0) {
      // Delete the empty game
      await query(`
        DELETE FROM games WHERE id = $1
      `, [gameId])
      console.log('[Leave Game API] Deleted empty game:', gameId);
    } else if (wasHost) {
      // If the host left, make the next player the host.
      const nextHostResult = await query(`
        SELECT id FROM game_players 
        WHERE game_id = $1 
        ORDER BY joined_at ASC 
        LIMIT 1
      `, [gameId]);

      if (nextHostResult.rows[0]) {
        const nextHostId = nextHostResult.rows[0].id;
        await query(`
          UPDATE game_players
          SET is_host = true
          WHERE id = $1
        `, [nextHostId]);
        console.log('[Leave Game API] Transferred host to player ID:', nextHostId);
      }
    }

    return NextResponse.json({ 
      success: true,
      gameDeleted: playerCount === 0
    })

  } catch (error) {
    console.error('Error in leave game:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 