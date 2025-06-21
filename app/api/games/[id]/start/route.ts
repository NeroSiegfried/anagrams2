import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { findValidSubwordsWithoutDefinitions } from '@/lib/word-service'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gameId = params.id
    const { userId } = await request.json()

    if (!gameId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Multiplayer log: game start parameters
    console.info('[Multiplayer] Start game request', { gameId, userId });

    const sql = neon(process.env.DATABASE_URL!)

    // Check if user is host
    const playerResult = await sql`
      SELECT is_host FROM game_players WHERE game_id = ${gameId} AND user_id = ${userId}
    `
    if (!playerResult || playerResult.length === 0 || !playerResult[0].is_host) {
      console.info('[Multiplayer] Start failed: not host', { gameId, userId });
      return NextResponse.json(
        { error: 'Only host can start the game' },
        { status: 403 }
      )
    }

    // Get the game and base word
    const gameResult = await sql`
      SELECT base_word, valid_words FROM games WHERE id = ${gameId}
    `
    
    if (!gameResult || gameResult.length === 0) {
      console.info('[Multiplayer] Game not found', { gameId });
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    const game = gameResult[0]
    const baseWord = game.base_word

    // Check if valid words are already computed
    if (game.valid_words && game.valid_words.length > 0) {
      console.info('[Multiplayer] Valid words already computed', { gameId, wordCount: game.valid_words.length });
    } else {
      // Pre-compute all valid words from the base word
      console.info('[Multiplayer] Computing valid words for base word', { gameId, baseWord });
      
      try {
        const validWords = await findValidSubwordsWithoutDefinitions(baseWord, 3)
        const validWordsList = validWords.map(word => word.word.toLowerCase())
        
        console.info('[Multiplayer] Found valid words', { gameId, wordCount: validWordsList.length });
        
        // Store the valid words in the database
        await sql`
          UPDATE games 
          SET valid_words = ${JSON.stringify(validWordsList)}::jsonb 
          WHERE id = ${gameId}
        `
        
        console.info('[Multiplayer] Stored valid words in database', { gameId, wordCount: validWordsList.length });
      } catch (error) {
        console.error('[Multiplayer] Error computing valid words', { gameId, error });
        return NextResponse.json(
          { error: 'Failed to compute valid words' },
          { status: 500 }
        )
      }
    }

    // Start the game
    try {
      await sql`
        UPDATE games SET status = 'active', started_at = NOW() WHERE id = ${gameId}
      `
      console.info('[Multiplayer] Game started', { gameId });
      return NextResponse.json({ success: true })
    } catch (error) {
      console.info('[Multiplayer] Error starting game', { gameId, error });
      return NextResponse.json(
        { error: 'Failed to start game' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.info('[Multiplayer] Error in start handler', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 