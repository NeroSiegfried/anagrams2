import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id
    const { userId, word, score } = await request.json()

    if (!gameId || !userId || !word || typeof score !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if player is in the game
    const playerResult = await query(`
      SELECT id, score, found_words FROM game_players 
      WHERE game_id = $1 AND user_id = $2
    `, [gameId, userId])

    if (!playerResult || !playerResult.rows || playerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Player not found in game' },
        { status: 404 }
      )
    }

    const player = playerResult.rows[0]
    const currentScore = player.score || 0
    const currentFoundWords = player.found_words || []
    
    // Check if word was already found by this player
    if (currentFoundWords.includes(word)) {
      return NextResponse.json(
        { error: 'Word already found by this player' },
        { status: 400 }
      )
    }

    // Update player's score and found words
    const newScore = currentScore + score
    const newFoundWords = [...currentFoundWords, word]

    try {
      await query(`
        UPDATE game_players 
        SET score = $1, found_words = $2, updated_at = NOW()
        WHERE game_id = $3 AND user_id = $4
      `, [newScore, newFoundWords, gameId, userId])
    } catch (error) {
      console.error('Error updating player score:', error)
      return NextResponse.json(
        { error: 'Failed to update score' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      newScore,
      newFoundWords
    })

  } catch (error) {
    console.error('Error in submit word:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 