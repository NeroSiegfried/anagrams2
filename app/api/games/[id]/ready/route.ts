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

    // Mark this player as ready
    await query(`
      UPDATE game_players SET ready = true, updated_at = NOW()
      WHERE game_id = $1 AND user_id = $2
    `, [gameId, userId])

    // Check if all players are ready
    const playersResult = await query(`
      SELECT ready FROM game_players WHERE game_id = $1
    `, [gameId])

    const allReady = playersResult.rows.every((row: any) => row.ready)

    if (allReady) {
      // Set started_at and status=active
      await query(`
        UPDATE games SET started_at = NOW(), status = 'active', updated_at = NOW()
        WHERE id = $1
      `, [gameId])
      return NextResponse.json({ allReady: true, started: true })
    }

    return NextResponse.json({ allReady: false, started: false })
  } catch (error) {
    console.error('Error in ready endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Mark this player as unready
    await query(`
      UPDATE game_players SET ready = false, updated_at = NOW()
      WHERE game_id = $1 AND user_id = $2
    `, [gameId, userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in unready endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 