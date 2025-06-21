import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization here
    // For now, we'll allow any POST request to trigger cleanup
    
    console.log('[Cleanup API] Starting cleanup process...')
    
    let cleanupResults = {
      emptyGames: 0,
      staleWaitingGames: 0,
      staleActiveGames: 0,
      orphanedPlayers: 0,
      invalidStatusGames: 0
    }
    
    // Clean up empty games (games with no players)
    try {
      const emptyGamesResult = await query(`
        DELETE FROM games 
        WHERE id IN (
          SELECT g.id 
          FROM games g 
          LEFT JOIN game_players gp ON g.id = gp.game_id 
          WHERE gp.id IS NULL
        )
        RETURNING id
      `)
      cleanupResults.emptyGames = emptyGamesResult?.rowCount || 0
      console.log(`[Cleanup API] Cleaned up ${cleanupResults.emptyGames} empty games`)
    } catch (error) {
      console.error('[Cleanup API] Error cleaning up empty games:', error)
    }
    
    // Clean up games that have been waiting for more than 1 hour
    try {
      const staleWaitingResult = await query(`
        DELETE FROM games 
        WHERE status = 'waiting' 
        AND created_at < NOW() - INTERVAL '1 hour'
        RETURNING id
      `)
      cleanupResults.staleWaitingGames = staleWaitingResult?.rowCount || 0
      console.log(`[Cleanup API] Cleaned up ${cleanupResults.staleWaitingGames} stale waiting games`)
    } catch (error) {
      console.error('[Cleanup API] Error cleaning up stale waiting games:', error)
    }
    
    // Clean up games that have been active for more than 2 hours
    try {
      const staleActiveResult = await query(`
        DELETE FROM games 
        WHERE status = 'active' 
        AND created_at < NOW() - INTERVAL '2 hours'
        RETURNING id
      `)
      cleanupResults.staleActiveGames = staleActiveResult?.rowCount || 0
      console.log(`[Cleanup API] Cleaned up ${cleanupResults.staleActiveGames} stale active games`)
    } catch (error) {
      console.error('[Cleanup API] Error cleaning up stale active games:', error)
    }
    
    // Clean up orphaned game_players entries
    try {
      const orphanedPlayersResult = await query(`
        DELETE FROM game_players 
        WHERE game_id NOT IN (SELECT id FROM games)
        RETURNING id
      `)
      cleanupResults.orphanedPlayers = orphanedPlayersResult?.rowCount || 0
      console.log(`[Cleanup API] Cleaned up ${cleanupResults.orphanedPlayers} orphaned player entries`)
    } catch (error) {
      console.error('[Cleanup API] Error cleaning up orphaned players:', error)
    }
    
    // Clean up games with invalid status
    try {
      const invalidStatusResult = await query(`
        DELETE FROM games 
        WHERE status NOT IN ('waiting', 'active', 'completed', 'cancelled')
        RETURNING id
      `)
      cleanupResults.invalidStatusGames = invalidStatusResult?.rowCount || 0
      console.log(`[Cleanup API] Cleaned up ${cleanupResults.invalidStatusGames} games with invalid status`)
    } catch (error) {
      console.error('[Cleanup API] Error cleaning up invalid status games:', error)
    }
    
    const totalCleaned = Object.values(cleanupResults).reduce((sum, count) => sum + count, 0)
    console.log(`[Cleanup API] Cleanup completed. Total items cleaned: ${totalCleaned}`)
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      results: cleanupResults,
      totalCleaned
    })
    
  } catch (error) {
    console.error('[Cleanup API] Error during cleanup:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error during cleanup' 
      },
      { status: 500 }
    )
  }
}

// Also allow GET requests for manual triggering
export async function GET(request: NextRequest) {
  return POST(request)
} 