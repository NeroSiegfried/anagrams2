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

    // Check if all non-host players are ready (host is always considered ready)
    const playersResult = await query(`
      SELECT is_host, ready FROM game_players WHERE game_id = $1
    `, [gameId])

    const nonHostPlayers = playersResult.rows.filter((row: any) => !row.is_host)
    const allNonHostReady = nonHostPlayers.length > 0 && nonHostPlayers.every((row: any) => row.ready)

    // Don't automatically start the game - let the host do it manually
    return NextResponse.json({ 
      allReady: allNonHostReady, 
      started: false 
    })
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