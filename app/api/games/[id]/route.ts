import { NextResponse } from "next/server"
import { getGameById, getGameParticipants, getScoresByGameId } from "@/lib/game-service"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const gameId = params.id

    const game = await getGameById(gameId)

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    const participants = await getGameParticipants(gameId)
    const scores = await getScoresByGameId(gameId)

    return NextResponse.json({ game, participants, scores })
  } catch (error) {
    console.error("Error fetching game:", error)
    return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 })
  }
}
