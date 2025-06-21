import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gameId = params.id
    const { userId, username, word, isValid } = await request.json()

    if (!gameId || !userId || !username || !word) {
      console.info('[Multiplayer] Missing required fields', { gameId, userId, username, word });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Multiplayer log: word submission parameters
    console.info('[Multiplayer] Word submission', { gameId, userId, username, word, isValid });

    const sql = neon(process.env.DATABASE_URL!)

    // Get the game to check status and basic validation
    const gameResult = await sql`
      SELECT g.base_word, g.status, g.time_limit, g.started_at
      FROM games g
      WHERE g.id = ${gameId}
    `

    if (!gameResult || gameResult.length === 0) {
      console.info('[Multiplayer] Game not found', { gameId });
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const game = gameResult[0]
    
    // Check if game is active
    if (game.status !== 'active') {
      console.info('[Multiplayer] Game not active', { gameId, status: game.status });
      return NextResponse.json(
        { error: 'Game is not active' },
        { status: 400 }
      )
    }

    const submittedWord = word.toLowerCase().trim()
    
    // Basic server-side validation (length checks)
    if (submittedWord.length < 3) {
      console.info('[Multiplayer] Word too short', { gameId, word: submittedWord });
      return NextResponse.json(
        { success: false, error: 'Word must be at least 3 letters long' },
        { status: 200 }
      )
    }

    if (submittedWord.length > game.base_word.length) {
      console.info('[Multiplayer] Word too long', { gameId, word: submittedWord, baseWord: game.base_word });
      return NextResponse.json(
        { success: false, error: 'Word cannot be longer than the base word' },
        { status: 200 }
      )
    }

    // Trust client-side validation result (isValid parameter)
    // This eliminates the need for server-side word validation against the database
    console.info('[Multiplayer] Client-side validation result', { 
      gameId, 
      word: submittedWord, 
      isValid 
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid word' },
        { status: 200 }
      )
    }

    // Check if word was already submitted by this player
    const existingSubmission = await sql`
      SELECT id FROM game_submissions 
      WHERE game_id = ${gameId} AND user_id = ${userId} AND word = ${submittedWord}
    `

    if (existingSubmission && existingSubmission.length > 0) {
      console.info('[Multiplayer] Word already submitted', { gameId, userId, word: submittedWord });
      return NextResponse.json(
        { success: false, error: 'Word already submitted' },
        { status: 200 }
      )
    }

    // Calculate score based on word length
    const score = submittedWord.length * 10

    // Record the submission
    try {
      await sql`
        INSERT INTO game_submissions (game_id, user_id, username, word, score, submitted_at)
        VALUES (${gameId}, ${userId}, ${username}, ${submittedWord}, ${score}, NOW())
      `

      // Update player's total score
      await sql`
        UPDATE game_players 
        SET score = score + ${score}
        WHERE game_id = ${gameId} AND user_id = ${userId}
      `

      console.info('[Multiplayer] Word submission successful', { 
        gameId, 
        userId, 
        word: submittedWord, 
        score 
      });

      return NextResponse.json({
        success: true,
        word: submittedWord,
        score,
        message: 'Word submitted successfully'
      })

    } catch (error) {
      console.error('[Multiplayer] Error recording submission', { gameId, error });
      return NextResponse.json(
        { error: 'Failed to record submission' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[Multiplayer] Error in submit-word handler', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 