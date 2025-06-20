import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

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

    // Check if the user is the host of this game
    const playerResult = await query(`
      SELECT is_host FROM game_players
      WHERE game_id = $1 AND user_id = $2
    `, [gameId, userId])

    if (!playerResult.rows || playerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Player not found in game' },
        { status: 404 }
      )
    }

    const player = playerResult.rows[0]
    if (!player.is_host) {
      return NextResponse.json(
        { error: 'Only host can update game settings' },
        { status: 403 }
      )
    }

    // Check if game is still in waiting state
    const gameResult = await query(`
      SELECT status FROM games WHERE id = $1
    `, [gameId])

    if (!gameResult.rows || gameResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const game = gameResult.rows[0]
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
      updates.push(`time_limit = $${paramIndex}`)
      values.push(timeLimit)
      paramIndex++
    }

    if (maxPlayers !== undefined) {
      if (maxPlayers < 2 || maxPlayers > 8) {
        return NextResponse.json(
          { error: 'Max players must be between 2 and 8' },
          { status: 400 }
        )
      }
      
      // Check if max players is less than current player count
      const currentPlayerCount = await query(`
        SELECT COUNT(*) as count FROM game_players WHERE game_id = $1
      `, [gameId])
      
      const playerCount = parseInt(currentPlayerCount.rows[0]?.count || '0', 10)
      if (maxPlayers < playerCount) {
        return NextResponse.json(
          { error: `Cannot set max players to ${maxPlayers} when there are already ${playerCount} players in the game` },
          { status: 400 }
        )
      }
      
      updates.push(`max_players = $${paramIndex}`)
      values.push(maxPlayers)
      paramIndex++
    }

    if (wordLength !== undefined) {
      if (wordLength < 5 || wordLength > 10) {
        return NextResponse.json(
          { error: 'Word length must be between 5 and 10 letters' },
          { status: 400 }
        )
      }
      
      // Get a new random word of the specified length
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

      const newBaseWord = wordResult.rows[0].word
      updates.push(`base_word = $${paramIndex}`)
      values.push(newBaseWord)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid settings to update' },
        { status: 400 }
      )
    }

    // Add gameId to values array
    values.push(gameId)

    // Update the game settings
    await query(`
      UPDATE games 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
    `, values)

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