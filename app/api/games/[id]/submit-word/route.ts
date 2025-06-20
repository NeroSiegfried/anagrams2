import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { findAllPossibleWords, type Word } from '@/lib/word-service'

// This should be kept in sync with the client-side scoring
function calculateScore(wordLength: number): number {
  if (wordLength < 3) return 0;
  if (wordLength === 3) return 100;
  if (wordLength === 4) return 300;
  if (wordLength === 5) return 1200;
  if (wordLength >= 6) return 2000 + 400 * (wordLength - 6);
  return 0; // Should not happen for valid words
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id
    const { userId, word } = await request.json()

    if (!gameId || !userId || !word ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // --- Server-side validation ---
    
    // 1. Get the base word for the game
    const gameResult = await query('SELECT base_word FROM games WHERE id = $1', [gameId]);
    if (!gameResult || !gameResult.rows || gameResult.rows.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    const baseWord = gameResult.rows[0].base_word;

    // 2. Get all possible words
    const possibleWords = await findAllPossibleWords(baseWord);
    const possibleWordSet = new Set(possibleWords.map((w: Word) => w.word.toLowerCase()));

    // 3. Validate submitted word
    if (!possibleWordSet.has(word.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid word' }, { status: 400 });
    }

    // --- Validation Passed, proceed to update score ---

    // Check if player is in the game and get their current state
    const playerResult = await query(`
      SELECT id, score, found_words FROM game_players 
      WHERE game_id = $1 AND user_id = $2
    `, [gameId, userId])

    if (!playerResult || !playerResult.rows || playerResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Player not found in game' },
        { status: 404 }
      )
    }

    const player = playerResult.rows[0]
    const currentScore = player.score || 0
    const currentFoundWords = player.found_words || []
    
    // Check if word was already found by this player
    if (currentFoundWords.map((w: string) => w.toLowerCase()).includes(word.toLowerCase())) {
      return NextResponse.json(
        { error: 'Word already found' },
        { status: 400 }
      )
    }

    // 4. Calculate score on the server
    const scoreForWord = calculateScore(word.length);

    // Update player's score and found words
    const newScore = currentScore + scoreForWord
    const newFoundWords = [...currentFoundWords, word]

    try {
      await query(`
        UPDATE game_players 
        SET score = $1, found_words = $2, updated_at = NOW()
        WHERE game_id = $3 AND user_id = $4
      `, [newScore, newFoundWords, gameId, userId])
    } catch (error) {
      console.error('Error updating player score:', error)
      return NextResponse.json(
        { error: 'Failed to update score' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      newScore,
      newFoundWords,
      scoreAdded: scoreForWord
    })

  } catch (error) {
    console.error('Error in submit word:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 