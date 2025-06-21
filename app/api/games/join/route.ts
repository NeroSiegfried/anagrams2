import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const { gameId, userId, username } = await request.json()

    if (!gameId || !userId || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Multiplayer log: join request parameters
    console.info('[Multiplayer] Join request', { gameId, userId, username });

    const sql = neon(process.env.DATABASE_URL!)

    // Check if game exists and is joinable
    const gameResult = await sql`SELECT * FROM games WHERE id = ${gameId}`
    if (!gameResult || gameResult.length === 0) {
      console.info('[Multiplayer] Join failed: game not found', { gameId });
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }
    const game = gameResult[0]
    
    // Allow joining waiting games (new games) or finished games (to start new games in same lobby)
    if (game.status !== 'waiting' && game.status !== 'finished') {
      console.info('[Multiplayer] Join failed: game not joinable', { gameId, status: game.status });
      return NextResponse.json(
        { error: 'Game is not joinable' },
        { status: 400 }
      )
    }
    
    // If joining a finished game, reset it to waiting status and generate a new word
    if (game.status === 'finished') {
      // Get the current word length to generate a new word of the same length
      const currentWordLength = game.base_word.length;
      
      // Get a new random word of the same length
      const wordResult = await sql`
        SELECT word FROM words WHERE length = ${currentWordLength} ORDER BY random() LIMIT 1
      `
      
      if (!wordResult || wordResult.length === 0) {
        console.info('[Multiplayer] No words available for length', { gameId, wordLength: currentWordLength });
        return NextResponse.json(
          { error: `No words available for length ${currentWordLength}` },
          { status: 500 }
        )
      }
      
      const newWord = wordResult[0].word;
      console.info('[Multiplayer] Generated new word for reset game', { gameId, newWord, wordLength: currentWordLength });
      
      // Clear previous game data but preserve scores
      await sql`DELETE FROM game_submissions WHERE game_id = ${gameId}`
      await sql`UPDATE game_players SET ready = false WHERE game_id = ${gameId}`
      await sql`
        UPDATE games 
        SET status = 'waiting', current_round = ${game.current_round + 1}, started_at = NULL, valid_words = NULL, base_word = ${newWord}, updated_at = NOW()
        WHERE id = ${gameId}
      `
      console.info('[Multiplayer] Reset finished game to waiting with new word, preserved scores', { gameId, newWord });
    }

    // Check if user is already in the game
    const playerResult = await sql`
      SELECT * FROM game_players WHERE game_id = ${gameId} AND user_id = ${userId}
    `
    if (playerResult && playerResult.length > 0) {
      console.info('[Multiplayer] User already in game', { gameId, userId });
      return NextResponse.json({ success: true, alreadyJoined: true })
    }

    // Add player to game
    try {
      console.info('[Multiplayer] Adding player to game with username:', { gameId, userId, username });
      
      await sql`
        INSERT INTO game_players (game_id, user_id, username, score, is_host)
        VALUES (${gameId}, ${userId}, ${username}, 0, false)
      `
      console.info('[Multiplayer] Player joined game', { gameId, userId, username });
      return NextResponse.json({ success: true })
    } catch (error) {
      console.info('[Multiplayer] Error joining game', { gameId, userId, error });
      return NextResponse.json(
        { error: 'Failed to join game' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.info('[Multiplayer] Error in join handler', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
