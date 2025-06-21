const { neon } = require('@neondatabase/serverless')

async function debugGameState() {
  console.log('Debugging game state...')
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set')
    return
  }

  const sql = neon(process.env.DATABASE_URL)

  try {
    // Get the most recent game
    console.log('\n1. Most recent games:')
    const recentGames = await sql`
      SELECT id, base_word, status, started_at, time_limit, current_round, created_at
      FROM games
      ORDER BY created_at DESC
      LIMIT 5
    `
    
    recentGames.forEach((game, index) => {
      console.log(`   Game ${index + 1}: ${game.id}`)
      console.log(`     Status: ${game.status}`)
      console.log(`     Base word: ${game.base_word}`)
      console.log(`     Started at: ${game.started_at}`)
      console.log(`     Time limit: ${game.time_limit}`)
      console.log(`     Current round: ${game.current_round}`)
      console.log(`     Created: ${game.created_at}`)
    })

    if (recentGames.length > 0) {
      const latestGame = recentGames[0]
      
      console.log(`\n2. Players in game ${latestGame.id}:`)
      const players = await sql`
        SELECT 
          gp.id, 
          gp.user_id, 
          gp.username, 
          gp.score, 
          gp.is_host, 
          gp.ready,
          gp.joined_at,
          u.display_name,
          u.username as user_username
        FROM game_players gp
        LEFT JOIN users u ON gp.user_id = u.id
        WHERE gp.game_id = ${latestGame.id}
        ORDER BY gp.score DESC, gp.joined_at ASC
      `
      
      players.forEach((player, index) => {
        console.log(`   Player ${index + 1}:`)
        console.log(`     User ID: ${player.user_id}`)
        console.log(`     Username (game_players): ${player.username}`)
        console.log(`     Display name (users): ${player.display_name}`)
        console.log(`     Username (users): ${player.user_username}`)
        console.log(`     Score: ${player.score}`)
        console.log(`     Is host: ${player.is_host}`)
        console.log(`     Ready: ${player.ready}`)
        console.log(`     Joined: ${player.joined_at}`)
      })

      console.log(`\n3. Word submissions for game ${latestGame.id}:`)
      const submissions = await sql`
        SELECT 
          gs.id,
          gs.user_id,
          gs.username,
          gs.word,
          gs.score,
          gs.submitted_at
        FROM game_submissions gs
        WHERE gs.game_id = ${latestGame.id}
        ORDER BY gs.submitted_at DESC
        LIMIT 10
      `
      
      if (submissions.length > 0) {
        submissions.forEach((submission, index) => {
          console.log(`   Submission ${index + 1}:`)
          console.log(`     User ID: ${submission.user_id}`)
          console.log(`     Username: ${submission.username}`)
          console.log(`     Word: ${submission.word}`)
          console.log(`     Score: ${submission.score}`)
          console.log(`     Submitted: ${submission.submitted_at}`)
        })
      } else {
        console.log('   No word submissions found')
      }

      console.log(`\n4. Scores table entries for game ${latestGame.id}:`)
      const scores = await sql`
        SELECT 
          s.id,
          s.user_id,
          s.score,
          s.words_found,
          s.created_at,
          u.display_name,
          u.username as user_username
        FROM scores s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.game_id = ${latestGame.id}
        ORDER BY s.created_at DESC
      `
      
      if (scores.length > 0) {
        scores.forEach((score, index) => {
          console.log(`   Score ${index + 1}:`)
          console.log(`     User ID: ${score.user_id}`)
          console.log(`     Display name: ${score.display_name}`)
          console.log(`     Username: ${score.user_username}`)
          console.log(`     Score: ${score.score}`)
          console.log(`     Words found: ${score.words_found}`)
          console.log(`     Created: ${score.created_at}`)
        })
      } else {
        console.log('   No scores found')
      }
    }

    console.log('\n✅ Debug completed!')

  } catch (error) {
    console.error('❌ Error debugging game state:', error)
  }
}

debugGameState() 