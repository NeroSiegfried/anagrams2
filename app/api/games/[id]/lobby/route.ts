import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// Load environment variables explicitly
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

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

    if (!process.env.DATABASE_URL) {
      console.error('[Lobby API] DATABASE_URL not set');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    // Create a fresh database connection for this request
    const sql = neon(process.env.DATABASE_URL);
    console.log('[Lobby API] Fresh database connection created');

    // Get game details
    const gameResult = await sql`
      SELECT g.*, u.username as creator_username
      FROM games g
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = ${gameId}
    `;

    if (!gameResult || gameResult.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const game = gameResult[0];

    // Server-side check to end the game if time is up
    if (game.status === 'active' && game.started_at) {
      const startTime = new Date(game.started_at).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);

      console.log('[Lobby API] Time check:', { 
        gameId, 
        status: game.status, 
        startedAt: game.started_at,
        timeLimit: game.time_limit,
        elapsedSeconds,
        shouldFinish: elapsedSeconds > game.time_limit
      });

      if (elapsedSeconds > game.time_limit) {
        // Time is up, update game status to finished
        await sql`UPDATE games SET status = 'finished', updated_at = NOW() WHERE id = ${gameId}`;
        game.status = 'finished'; // Update the object we're about to send
        console.log(`[Lobby API] Game ${gameId} time is up. Status set to finished.`);
      }
    }

    // Censor base_word if game is not active
    if (game.status === 'waiting') {
      game.base_word = game.base_word.split('').map(() => ' ').join('');
    }

    // Add valid words for active games (send the actual array for client-side validation)
    if (game.status === 'active' && game.valid_words) {
      game.valid_words_count = game.valid_words.length;
      // Send the actual valid_words array to the client for client-side validation
      // This eliminates the need for database queries on every word submission
    } else {
      game.valid_words_count = 0;
      game.valid_words = [];
    }

    // Get players for this game, ordered by score (highest first)
    const playersResult = await sql`
      SELECT 
        gp.id, 
        gp.user_id, 
        gp.username, 
        gp.score, 
        gp.is_host, 
        gp.ready
      FROM game_players gp
      WHERE gp.game_id = ${gameId}
      ORDER BY gp.score DESC, gp.joined_at ASC
    `;

    console.log('[Lobby API] Raw players result:', playersResult);

    // Get found words for each player from game_submissions
    const foundWordsResult = await sql`
      SELECT 
        user_id,
        ARRAY_AGG(word) as found_words
      FROM game_submissions 
      WHERE game_id = ${gameId}
      GROUP BY user_id
    `;

    console.log('[Lobby API] Found words result:', foundWordsResult);

    // Create a map of user_id to found_words for quick lookup
    const foundWordsMap = new Map();
    foundWordsResult.forEach((row: any) => {
      foundWordsMap.set(row.user_id, row.found_words || []);
    });

    // Process players to use the stored username and include found words
    const processedPlayers = playersResult.map(player => ({
      id: player.id,
      user_id: player.user_id,
      username: player.username || 'Guest',
      score: player.score || 0,
      is_host: player.is_host,
      ready: player.ready,
      found_words: foundWordsMap.get(player.user_id) || []
    }));

    console.log('[Lobby API] Processed players:', processedPlayers);

    const gameWithPlayers = {
      ...game,
      game_players: processedPlayers || [],
      player_count: processedPlayers?.length || 0
    }

    return NextResponse.json({ game: gameWithPlayers })

  } catch (error) {
    console.error('[Lobby API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
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

    if (!process.env.DATABASE_URL) {
      console.error('[Lobby API] DATABASE_URL not set');
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 });
    }

    // Create a fresh database connection for this request
    const sql = neon(process.env.DATABASE_URL);

    if (action === 'start') {
      // Check if user is host
      const playerResult = await sql`
        SELECT is_host FROM game_players 
        WHERE game_id = ${gameId} AND user_id = ${userId}
      `;

      if (!playerResult || playerResult.length === 0) {
        return NextResponse.json(
          { error: 'Player not found in game' },
          { status: 404 }
        )
      }

      const player = playerResult[0];
      if (!player.is_host) {
        return NextResponse.json(
          { error: 'Only host can start the game' },
          { status: 403 }
        )
      }

      // Update game status to active
      try {
        await sql`UPDATE games SET status = 'active' WHERE id = ${gameId}`;
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
    console.error('[Lobby API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
} 