import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

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

    // Create a fresh database connection for this request
    const sql = neon(process.env.DATABASE_URL!)

    // Mark this player as ready
    await sql`
      UPDATE game_players SET ready = true, updated_at = NOW()
      WHERE game_id = ${gameId} AND user_id = ${userId}
    `

    // Check if all non-host players are ready (host is always considered ready)
    const playersResult = await sql`
      SELECT is_host, ready FROM game_players WHERE game_id = ${gameId}
    `

    const nonHostPlayers = playersResult.filter((row: any) => !row.is_host)
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

    // Create a fresh database connection for this request
    const sql = neon(process.env.DATABASE_URL!)

    // Mark this player as unready
    await sql`
      UPDATE game_players SET ready = false, updated_at = NOW()
      WHERE game_id = ${gameId} AND user_id = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in unready endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 