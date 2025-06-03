import { NextResponse } from "next/server"
import { findAllPossibleWords } from "@/lib/word-service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const letters = searchParams.get("letters")?.toLowerCase()

  if (!letters) {
    return NextResponse.json({ error: "Letters parameter is required" }, { status: 400 })
  }

  try {
    const words = await findAllPossibleWords(letters)
    return NextResponse.json({ words })
  } catch (error) {
    console.error("Error finding possible words:", error)
    return NextResponse.json({ error: "Failed to find possible words" }, { status: 500 })
  }
}
