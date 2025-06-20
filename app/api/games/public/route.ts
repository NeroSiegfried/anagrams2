import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('[Public Games API] Fetching public games');
    
    // First, clean up empty games (games with no players)
    try {
      await query(`
        DELETE FROM games 
        WHERE id IN (
          SELECT g.id 
          FROM games g 
          LEFT JOIN game_players gp ON g.id = gp.game_id 
          WHERE gp.id IS NULL
        )
      `);
      console.log('[Public Games API] Cleaned up empty games');
    } catch (cleanupError) {
      console.error('[Public Games API] Error cleaning up empty games:', cleanupError);
    }
    
    // Get public games that are waiting for players or active (up to 10)
    const result = await query(`
      SELECT 
        g.id,
        g.base_word,
        g.created_by,
        u.username as creator_username,
        g.status,
        g.current_round,
        g.time_limit,
        g.max_players,
        g.created_at,
        COUNT(gp.id) as player_count
      FROM games g
      LEFT JOIN users u ON g.created_by = u.id
      LEFT JOIN game_players gp ON g.id = gp.game_id
      WHERE g.is_public = true AND g.status IN ('waiting', 'active')
      GROUP BY g.id, g.base_word, g.created_by, u.username, g.status, g.current_round, g.time_limit, g.max_players, g.created_at
      HAVING COUNT(gp.id) > 0
      ORDER BY g.created_at DESC
      LIMIT 10
    `)

    console.log('[Public Games API] Raw result:', result?.rows);

    if (!result || !result.rows) {
      return NextResponse.json(
        { error: 'Failed to fetch public games' },
        { status: 500 }
      )
    }

    // Get players for each game
    const gamesWithPlayers = await Promise.all(
      result.rows.map(async (game: any) => {
        const playersResult = await query(`
          SELECT id, user_id, username, score, is_host
          FROM game_players
          WHERE game_id = $1
        `, [game.id])

        // Fix usernames that are UUIDs
        const fixedPlayers = (playersResult?.rows || []).map((player: any) => {
          // If username is a UUID, try to get the actual username from users table
          if (player.username && player.username.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            // For now, just return a fallback - in a real app you'd join with users table
            return {
              ...player,
              username: 'Anonymous'
            }
          }
          return player
        })

        return {
          ...game,
          game_players: fixedPlayers
        }
      })
    )

    return NextResponse.json({ games: gamesWithPlayers })

  } catch (error) {
    console.error('Error in public games:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 