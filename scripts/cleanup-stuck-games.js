import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function cleanupStuckGames() {
  try {
    console.log('Checking for games stuck in "starting" status...')
    
    // Find games stuck in starting status
    const stuckGamesResult = await pool.query(`
      SELECT id, status, created_at, updated_at 
      FROM games 
      WHERE status = 'starting'
    `)
    
    if (stuckGamesResult.rows.length === 0) {
      console.log('No games found stuck in "starting" status.')
      return
    }
    
    console.log(`Found ${stuckGamesResult.rows.length} games stuck in "starting" status:`)
    stuckGamesResult.rows.forEach(game => {
      console.log(`- Game ${game.id}: created ${game.created_at}, updated ${game.updated_at}`)
    })
    
    // Reset them to waiting status
    const resetResult = await pool.query(`
      UPDATE games 
      SET status = 'waiting', updated_at = NOW()
      WHERE status = 'starting'
    `)
    
    console.log(`Reset ${resetResult.rowCount} games from "starting" to "waiting" status.`)
    
    // Also check for any games that are active but have no ready players
    console.log('\nChecking for active games with no ready players...')
    
    const activeGamesResult = await pool.query(`
      SELECT g.id, g.status, g.started_at, COUNT(gp.id) as player_count
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      WHERE g.status = 'active'
      GROUP BY g.id, g.status, g.started_at
    `)
    
    console.log(`Found ${activeGamesResult.rows.length} active games:`)
    activeGamesResult.rows.forEach(game => {
      console.log(`- Game ${game.id}: ${game.player_count} players, started ${game.started_at}`)
    })
    
  } catch (error) {
    console.error('Error cleaning up stuck games:', error)
  } finally {
    await pool.end()
  }
}

cleanupStuckGames() 