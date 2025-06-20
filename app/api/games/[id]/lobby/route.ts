import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      )
    }

    // Get game details
    const gameResult = await query(`
      SELECT g.*, u.username as creator_username
      FROM games g
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = $1
    `, [gameId])

    if (!gameResult || !gameResult.rows || gameResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const game = gameResult.rows[0]

    // Server-side check to end the game if time is up
    if (game.status === 'active' && game.started_at) {
      const startTime = new Date(game.started_at).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);

      if (elapsedSeconds > game.time_limit) {
        // Time is up, update game status to finished
        await query(`UPDATE games SET status = 'finished', updated_at = NOW() WHERE id = $1`, [gameId]);
        game.status = 'finished'; // Update the object we're about to send
        console.log(`[Lobby API] Game ${gameId} time is up. Status set to finished.`);
      }
    }

    // Censor base_word if game is not active
    if (game.status === 'waiting') {
      game.base_word = game.base_word.split('').map(() => ' ').join('');
    }

    // Get players for this game
    const playersResult = await query(`
      SELECT id, user_id, username, score, is_host, ready
      FROM game_players
      WHERE game_id = $1
      ORDER BY joined_at ASC
    `, [gameId])

    const gameWithPlayers = {
      ...game,
      game_players: playersResult?.rows || [],
      player_count: playersResult?.rows?.length || 0
    }

    return NextResponse.json({ game: gameWithPlayers })

  } catch (error) {
    console.error('Error in lobby info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id
    const { action, userId } = await request.json()

    if (!gameId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (action === 'start') {
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

      // Update game status to active
      try {
        await query(`
          UPDATE games SET status = 'active' WHERE id = $1
        `, [gameId])
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to start game' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in lobby action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 