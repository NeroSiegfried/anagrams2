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
        { error: 'Only host can start a new round' },
        { status: 403 }
      )
    }

    // Get current game info
    const gameResult = await query(`
      SELECT * FROM games WHERE id = $1
    `, [gameId])

    if (!gameResult || !gameResult.rows || gameResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const game = gameResult.rows[0]

    // Get a new random word with the same length as the current word
    const wordLength = game.base_word.length
    const wordResult = await query(`
      SELECT word FROM words 
      WHERE LENGTH(word) = $1 
      ORDER BY RANDOM() 
      LIMIT 1
    `, [wordLength])

    if (!wordResult || !wordResult.rows || wordResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No words available for this length' },
        { status: 500 }
      )
    }

    const newWord = wordResult.rows[0].word

    // Update game with new word and reset state
    try {
      await query(`
        UPDATE games 
        SET 
          base_word = $1,
          status = 'waiting',
          current_round = current_round + 1,
          started_at = NULL,
          updated_at = NOW()
        WHERE id = $2
      `, [newWord, gameId])

      // Reset all players' scores and ready status
      await query(`
        UPDATE game_players 
        SET 
          score = 0,
          ready = false,
          updated_at = NOW()
        WHERE game_id = $1
      `, [gameId])

    } catch (error) {
      console.error('Error starting new round:', error)
      return NextResponse.json(
        { error: 'Failed to start new round' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      newWord: newWord,
      newRound: game.current_round + 1
    })

  } catch (error) {
    console.error('Error in new round:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 