import { NextResponse } from "next/server"
import { submitScore } from "@/lib/game-service"

export async function POST(request: Request) {
  try {
    const { gameId, username, score, wordsFound, wordsList, userId } = await request.json()

    if (!gameId || !username || score === undefined || wordsFound === undefined || !wordsList) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const scoreRecord = await submitScore(gameId, username, score, wordsFound, wordsList, userId || null)

    return NextResponse.json({ score: scoreRecord })
  } catch (error) {
    console.error("Error submitting score:", error)
    return NextResponse.json({ error: "Failed to submit score" }, { status: 500 })
  }
}
