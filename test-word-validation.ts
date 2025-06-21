import { query } from './lib/db';

async function testWordValidation() {
  const testWords = ['bull', 'dull', 'bulled', 'guy', 'gun', 'yen', 'eugeny'];
  
  console.log('Testing word validation...');
  
  for (const word of testWords) {
    try {
      console.log(`\nTesting word: "${word}"`);
      const result = await query(
        "SELECT id, word FROM words WHERE word = $1 LIMIT 1",
        [word.toLowerCase()]
      );
      console.log(`Result for "${word}":`, result);
      console.log(`Found: ${result.rows.length > 0}`);
    } catch (error) {
      console.error(`Error testing "${word}":`, error);
    }
  }
}

testWordValidation().catch(console.error); 