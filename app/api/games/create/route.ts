import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const { isPublic, createdBy, wordLength = 6, timeLimit = 120, username } = await request.json()

    if (typeof isPublic !== 'boolean' || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Ensure username is not undefined
    const playerUsername = username || createdBy;

    console.log('[Create Game API] Creating game with:', { isPublic, createdBy, wordLength, timeLimit, username: playerUsername });

    // Create a fresh database connection for this request
    const sql = neon(process.env.DATABASE_URL!)

    // Use a transaction to prevent race conditions
    await sql`BEGIN`

    try {
      // Get a random word of the specified length
      const wordResult = await sql`
        SELECT word FROM words WHERE length = ${wordLength} ORDER BY random() LIMIT 1
      `

      if (!wordResult || wordResult.length === 0) {
        await sql`ROLLBACK`
        return NextResponse.json(
          { error: `No words found with length ${wordLength}` },
          { status: 400 }
        )
      }

      const baseWord = wordResult[0].word

      // Create the game
      const gameResult = await sql`
        INSERT INTO games (base_word, is_public, created_by, status, current_round, time_limit, max_players)
        VALUES (${baseWord}, ${isPublic}, ${createdBy}, 'waiting', 1, ${timeLimit}, 4)
        RETURNING *
      `

      if (!gameResult || gameResult.length === 0) {
        await sql`ROLLBACK`
        return NextResponse.json(
          { error: 'Failed to create game' },
          { status: 500 }
        )
      }

      const game = gameResult[0]

      // Add the creator as the first player
      await sql`
        INSERT INTO game_players (game_id, user_id, username, score, is_host)
        VALUES (${game.id}, ${createdBy}, ${playerUsername}, 0, true)
      `

      await sql`COMMIT`

      return NextResponse.json({ 
        gameId: game.id,
        game: game 
      })

    } catch (error) {
      await sql`ROLLBACK`
      console.error('Error in create game transaction:', error)
      return NextResponse.json(
        { error: 'Failed to create game' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in create game:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 