import { NextResponse } from "next/server"
import { validateWord } from "@/lib/word-service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const word = searchParams.get("word")?.toLowerCase()

  if (!word) {
    return NextResponse.json({ error: "Word parameter is required" }, { status: 400 })
  }

  try {
    const isValid = await validateWord(word)
    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error("Error validating word:", error)
    return NextResponse.json({ error: "Failed to validate word" }, { status: 500 })
  }
}
