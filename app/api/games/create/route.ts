import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { isPublic, createdBy, wordLength = 6, timeLimit = 120 } = await request.json()

    if (typeof isPublic !== 'boolean' || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get a random word of the specified length
    let wordResult
    try {
      wordResult = await query(
        `SELECT word FROM words WHERE length = $1 ORDER BY random() LIMIT 1`,
        [wordLength]
      )
    } catch (error) {
      console.error('Error getting random word:', error)
      return NextResponse.json(
        { error: 'Failed to get random word' },
        { status: 500 }
      )
    }

    if (!wordResult || !wordResult.rows || wordResult.rows.length === 0) {
      return NextResponse.json(
        { error: `No words found with length ${wordLength}` },
        { status: 400 }
      )
    }

    const baseWord = wordResult.rows[0].word

    // Create the game
    let gameResult
    try {
      gameResult = await query(
        `INSERT INTO games (base_word, is_public, created_by, status, current_round, time_limit, max_players)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [baseWord, isPublic, createdBy, 'waiting', 1, timeLimit, 4]
      )
    } catch (error) {
      console.error('Error creating game:', error)
      return NextResponse.json(
        { error: 'Failed to create game' },
        { status: 500 }
      )
    }

    if (!gameResult || !gameResult.rows || gameResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create game' },
        { status: 500 }
      )
    }

    const game = gameResult.rows[0]

    // Add the creator as the first player
    try {
      await query(
        `INSERT INTO game_players (game_id, user_id, username, score, is_host)
         VALUES ($1, $2, $3, $4, $5)`,
        [game.id, createdBy, createdBy, 0, true]
      )
    } catch (error) {
      console.error('Error adding player to game:', error)
      return NextResponse.json(
        { error: 'Failed to add player to game' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      gameId: game.id,
      game: game 
    })

  } catch (error) {
    console.error('Error in create game:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 