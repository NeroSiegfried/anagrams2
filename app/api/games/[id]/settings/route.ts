import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id
    const { userId, timeLimit, maxPlayers, wordLength } = await request.json()

    if (!gameId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)

    // Check if the user is the host of this game
    const playerResult = await sql`
      SELECT is_host FROM game_players
      WHERE game_id = ${gameId} AND user_id = ${userId}
    `

    if (!playerResult || playerResult.length === 0) {
      return NextResponse.json(
        { error: 'Player not found in game' },
        { status: 404 }
      )
    }

    const player = playerResult[0]
    if (!player.is_host) {
      return NextResponse.json(
        { error: 'Only host can update game settings' },
        { status: 403 }
      )
    }

    // Check if game is still in waiting state
    const gameResult = await sql`
      SELECT status FROM games WHERE id = ${gameId}
    `

    if (!gameResult || gameResult.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const game = gameResult[0]
    if (game.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Cannot update settings after game has started' },
        { status: 400 }
      )
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (timeLimit !== undefined) {
      if (timeLimit < 60 || timeLimit > 300) {
        return NextResponse.json(
          { error: 'Time limit must be between 60 and 300 seconds' },
          { status: 400 }
        )
      }
    }

    if (maxPlayers !== undefined) {
      if (maxPlayers < 2 || maxPlayers > 8) {
        return NextResponse.json(
          { error: 'Max players must be between 2 and 8' },
          { status: 400 }
        )
      }
      
      // Check if max players is less than current player count
      const currentPlayerCount = await sql`
        SELECT COUNT(*) as count FROM game_players WHERE game_id = ${gameId}
      `
      
      const playerCount = parseInt(currentPlayerCount[0]?.count || '0', 10)
      if (maxPlayers < playerCount) {
        return NextResponse.json(
          { error: `Cannot set max players to ${maxPlayers} when there are already ${playerCount} players in the game` },
          { status: 400 }
        )
      }
    }

    if (wordLength !== undefined) {
      if (wordLength < 5 || wordLength > 10) {
        return NextResponse.json(
          { error: 'Word length must be between 5 and 10 letters' },
          { status: 400 }
        )
      }
    }

    if (timeLimit === undefined && maxPlayers === undefined && wordLength === undefined) {
      return NextResponse.json(
        { error: 'No valid settings to update' },
        { status: 400 }
      )
    }

    // Update the game settings - handle each update separately to avoid dynamic SQL
    if (timeLimit !== undefined) {
      await sql`UPDATE games SET time_limit = ${timeLimit}, updated_at = NOW() WHERE id = ${gameId}`
    }
    
    if (maxPlayers !== undefined) {
      await sql`UPDATE games SET max_players = ${maxPlayers}, updated_at = NOW() WHERE id = ${gameId}`
    }
    
    if (wordLength !== undefined) {
      // Get a new random word of the specified length
      let wordResult
      try {
        wordResult = await sql`
          SELECT word FROM words WHERE length = ${wordLength} ORDER BY random() LIMIT 1
        `
      } catch (error) {
        console.error('Error getting random word:', error)
        return NextResponse.json(
          { error: 'Failed to get random word' },
          { status: 500 }
        )
      }

      if (!wordResult || wordResult.length === 0) {
        return NextResponse.json(
          { error: `No words found with length ${wordLength}` },
          { status: 400 }
        )
      }

      const newBaseWord = wordResult[0].word
      await sql`UPDATE games SET base_word = ${newBaseWord}, updated_at = NOW() WHERE id = ${gameId}`
    }

    return NextResponse.json({ 
      success: true,
      message: 'Game settings updated successfully'
    })

  } catch (error) {
    console.error('Error updating game settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gameId = params.id
    const { is_public } = await request.json()

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database configuration error' }, { status: 500 })
    }
    const sql = neon(process.env.DATABASE_URL)

    await sql`UPDATE games SET is_public = ${is_public} WHERE id = ${gameId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
} 