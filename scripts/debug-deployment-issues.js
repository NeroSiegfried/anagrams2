const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

async function debugDeploymentIssues() {
  console.log('🔍 DEBUGGING DEPLOYMENT ISSUES 🔍')
  
  try {
    // Check environment variables
    console.log('\n=== ENVIRONMENT CHECK ===')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 30) + '...')
    
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not set!')
      return
    }
    
    // Test database connection
    console.log('\n=== DATABASE CONNECTION TEST ===')
    const sql = neon(process.env.DATABASE_URL)
    
    try {
      const testResult = await sql`SELECT 1 as test`
      console.log('✅ Database connection successful:', testResult)
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      return
    }
    
    // Test the exact query from the API
    console.log('\n=== PUBLIC GAMES QUERY TEST ===')
    try {
      const publicGames = await sql`
        SELECT 
          g.id,
          g.base_word,
          g.is_public,
          g.status,
          g.created_by,
          g.current_round,
          g.time_limit,
          g.max_players,
          g.created_at,
          COUNT(gp.id) as player_count,
          g.max_players - COUNT(gp.id) as available_slots
        FROM games g
        LEFT JOIN game_players gp ON g.id = gp.game_id
        WHERE g.is_public = true 
          AND g.status = 'waiting'
        GROUP BY g.id, g.base_word, g.is_public, g.status, g.created_by, 
                 g.current_round, g.time_limit, g.max_players, g.created_at
        HAVING COUNT(gp.id) > 0 AND COUNT(gp.id) < g.max_players
        ORDER BY g.created_at DESC
        LIMIT 20
      `
      console.log('✅ Public games query successful')
      console.log('Found games:', publicGames.length)
      console.log('Sample game:', publicGames[0] || 'No games found')
    } catch (error) {
      console.error('❌ Public games query failed:', error)
    }
    
    // Check for any games that should be public but aren't showing up
    console.log('\n=== GAMES ANALYSIS ===')
    const allGames = await sql`
      SELECT 
        g.id,
        g.base_word,
        g.is_public,
        g.status,
        g.created_at,
        COUNT(gp.id) as player_count,
        g.max_players
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      GROUP BY g.id, g.base_word, g.is_public, g.status, g.created_at, g.max_players
      ORDER BY g.created_at DESC
      LIMIT 10
    `
    
    console.log('Recent games:')
    allGames.forEach(game => {
      const shouldBePublic = game.is_public && game.status === 'waiting' && 
                            game.player_count > 0 && game.player_count < game.max_players
      console.log(`  ${game.base_word} (${game.id.substring(0, 8)}...):`, {
        is_public: game.is_public,
        status: game.status,
        player_count: game.player_count,
        max_players: game.max_players,
        should_be_public: shouldBePublic
      })
    })
    
    // Check for potential issues
    console.log('\n=== POTENTIAL ISSUES ===')
    
    // Check for games with no players
    const emptyGames = await sql`
      SELECT g.id, g.base_word, g.is_public, g.status
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      WHERE g.is_public = true AND g.status = 'waiting'
      GROUP BY g.id, g.base_word, g.is_public, g.status
      HAVING COUNT(gp.id) = 0
    `
    if (emptyGames.length > 0) {
      console.log('⚠️  Found public games with no players:', emptyGames.length)
    }
    
    // Check for full games
    const fullGames = await sql`
      SELECT g.id, g.base_word, COUNT(gp.id) as player_count, g.max_players
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      WHERE g.is_public = true AND g.status = 'waiting'
      GROUP BY g.id, g.base_word, g.max_players
      HAVING COUNT(gp.id) >= g.max_players
    `
    if (fullGames.length > 0) {
      console.log('⚠️  Found full public games:', fullGames.length)
    }
    
    console.log('\n✅ Deployment diagnostic complete')
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error)
  }
}

debugDeploymentIssues() 