const { neon } = require('@neondatabase/serverless')

async function testWordGeneration() {
  console.log('Testing word generation for multiplayer games...')
  
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set')
    return
  }

  const sql = neon(process.env.DATABASE_URL)

  try {
    // Test 1: Get multiple random words of the same length
    console.log('\n1. Testing random word generation for length 6:')
    for (let i = 0; i < 5; i++) {
      const wordResult = await sql`
        SELECT word FROM words WHERE length = 6 ORDER BY random() LIMIT 1
      `
      if (wordResult && wordResult.length > 0) {
        console.log(`   Word ${i + 1}: ${wordResult[0].word}`)
      } else {
        console.log(`   No word found for iteration ${i + 1}`)
      }
    }

    // Test 2: Check if we have enough words of different lengths
    console.log('\n2. Checking word availability by length:')
    const lengthCounts = await sql`
      SELECT length, COUNT(*) as count 
      FROM words 
      GROUP BY length 
      ORDER BY length
    `
    
    for (const row of lengthCounts) {
      console.log(`   Length ${row.length}: ${row.count} words`)
    }

    // Test 3: Simulate the join API logic for resetting a game
    console.log('\n3. Testing game reset with new word generation:')
    
    // First, get a sample game (or create one for testing)
    const sampleGame = await sql`
      SELECT id, base_word, status FROM games LIMIT 1
    `
    
    if (sampleGame && sampleGame.length > 0) {
      const game = sampleGame[0]
      console.log(`   Sample game: ${game.id}, current word: ${game.base_word}, status: ${game.status}`)
      
      // Simulate the word generation logic from join API
      const currentWordLength = game.base_word.length
      const newWordResult = await sql`
        SELECT word FROM words WHERE length = ${currentWordLength} ORDER BY random() LIMIT 1
      `
      
      if (newWordResult && newWordResult.length > 0) {
        const newWord = newWordResult[0].word
        console.log(`   Generated new word for length ${currentWordLength}: ${newWord}`)
        console.log(`   Words are different: ${game.base_word !== newWord}`)
      } else {
        console.log(`   Failed to generate new word for length ${currentWordLength}`)
      }
    } else {
      console.log('   No games found in database')
    }

    console.log('\n✅ Word generation test completed!')

  } catch (error) {
    console.error('❌ Error testing word generation:', error)
  }
}

testWordGeneration() 