import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// Score calculation function to match frontend
function calculateScore(wordLength: number): number {
  if (wordLength === 3) return 100
  if (wordLength === 4) return 300
  if (wordLength === 5) return 1200
  if (wordLength === 6) return 2000
  return 2000 + 400 * (wordLength - 6)
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gameId = params.id
    const { userId, username, word } = await request.json()

    if (!gameId || !userId || !username || !word) {
      console.info('[Multiplayer] Missing required fields for score update', { gameId, userId, username, word })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.info('[Multiplayer] Real-time score update request', { gameId, userId, username, word })

    if (!process.env.DATABASE_URL) {
      console.error('[Multiplayer] DATABASE_URL not set')
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)

    // Calculate score for this word
    const wordScore = calculateScore(word.length)

    // Update player's score in game_players table immediately
    const updateResult = await sql`
      UPDATE game_players 
      SET score = score + ${wordScore}
      WHERE game_id = ${gameId} AND user_id = ${userId}
      RETURNING score
    `

    if (!updateResult || updateResult.length === 0) {
      console.error('[Multiplayer] Player not found in game for score update', { gameId, userId })
      return NextResponse.json(
        { error: 'Player not found in game' },
        { status: 404 }
      )
    }

    const newScore = updateResult[0].score

    // Also add the word to game_submissions for tracking
    await sql`
      INSERT INTO game_submissions (game_id, user_id, word, score, submitted_at)
      VALUES (${gameId}, ${userId}, ${word}, ${wordScore}, NOW())
    `

    console.info('[Multiplayer] Score updated successfully', { 
      gameId, 
      userId, 
      username, 
      word, 
      wordScore, 
      newTotalScore: newScore 
    })

    return NextResponse.json({ 
      success: true, 
      wordScore, 
      totalScore: newScore 
    })

  } catch (error) {
    console.error('[Multiplayer] Error updating score:', error)
    return NextResponse.json(
      { error: 'Failed to update score' },
      { status: 500 }
    )
  }
} 