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
    const { userId, username, words, totalScore } = await request.json()

    if (!gameId || !userId || !username || !words || !Array.isArray(words)) {
      console.info('[Multiplayer] Missing required fields for final score submission', { gameId, userId, username, words })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.info('[Multiplayer] Final score submission request', { gameId, userId, username, wordsCount: words.length, totalScore })

    if (!process.env.DATABASE_URL) {
      console.error('[Multiplayer] DATABASE_URL not set')
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)

    // Calculate total score from words
    const calculatedScore = words.reduce((sum, word) => sum + calculateScore(word.length), 0)

    // Save final score to scores table
    const scoreResult = await sql`
      INSERT INTO scores (game_id, user_id, username, score, words_found, words_list, completed_at, is_guest)
      VALUES (${gameId}, ${userId}, ${username}, ${calculatedScore}, ${words.length}, ${words}, NOW(), ${!userId})
      RETURNING id, score, words_found
    `

    if (!scoreResult || scoreResult.length === 0) {
      console.error('[Multiplayer] Failed to save final score to scores table')
      return NextResponse.json(
        { error: 'Failed to save final score' },
        { status: 500 }
      )
    }

    const savedScore = scoreResult[0]

    console.info('[Multiplayer] Final score saved successfully', { 
      gameId, 
      userId, 
      username, 
      wordsCount: words.length,
      calculatedScore: savedScore.score,
      wordsFound: savedScore.words_found
    })

    return NextResponse.json({ 
      success: true, 
      score: savedScore.score,
      wordsFound: savedScore.words_found
    })

  } catch (error) {
    console.error('[Multiplayer] Error submitting final score:', error)
    return NextResponse.json(
      { error: 'Failed to submit final score' },
      { status: 500 }
    )
  }
} 