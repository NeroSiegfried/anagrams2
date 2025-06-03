import { NextResponse } from "next/server"
import { getGameByCode, joinGame } from "@/lib/game-service"

export async function POST(request: Request) {
  try {
    const { gameCode, username, userId } = await request.json()

    if (!gameCode || !username) {
      return NextResponse.json({ error: "Game code and username are required" }, { status: 400 })
    }

    const game = await getGameByCode(gameCode)

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    const participant = await joinGame(game.id, username, userId || null)

    return NextResponse.json({ game, participant })
  } catch (error) {
    console.error("Error joining game:", error)
    return NextResponse.json({ error: "Failed to join game" }, { status: 500 })
  }
}
