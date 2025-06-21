import { NextResponse } from "next/server"
import { findAllPossibleWords, findValidSubwordsWithoutDefinitions } from "@/lib/word-service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const letters = searchParams.get("letters")?.toLowerCase()
  const withoutDefinitions = searchParams.get("withoutDefinitions") === "true"

  if (!letters) {
    return NextResponse.json({ error: "Letters parameter is required" }, { status: 400 })
  }

  try {
    if (withoutDefinitions) {
      // Return only words without definitions for better performance
      const words = await findValidSubwordsWithoutDefinitions(letters)
      return NextResponse.json({ words })
    } else {
      // Return full word objects with definitions
      const words = await findAllPossibleWords(letters)
      return NextResponse.json({ words })
    }
  } catch (error) {
    console.error("Error finding possible words:", error)
    return NextResponse.json({ error: "Failed to find possible words" }, { status: 500 })
  }
}
