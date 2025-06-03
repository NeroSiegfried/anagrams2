import { NextResponse } from "next/server"
import { createGame, getTopScores } from "@/lib/game-service"

export async function POST(request: Request) {
  try {
    const { letters, baseWord, isMultiplayer, durationSeconds, maxPlayers } = await request.json()

    if (!letters) {
      return NextResponse.json({ error: "Letters are required" }, { status: 400 })
    }

    const game = await createGame(
      letters,
      baseWord || null,
      isMultiplayer || false,
      durationSeconds || 60,
      maxPlayers || 1,
    )

    return NextResponse.json({ game })
  } catch (error) {
    console.error("Error creating game:", error)
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const scores = await getTopScores(limit)

    return NextResponse.json({ scores })
  } catch (error) {
    console.error("Error fetching top scores:", error)
    return NextResponse.json({ error: "Failed to fetch top scores" }, { status: 500 })
  }
}
