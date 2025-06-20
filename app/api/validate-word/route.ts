import { NextResponse } from "next/server"
import { validateWord } from "@/lib/word-service"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const word = searchParams.get("word")?.toLowerCase()

  console.log('[Validate Word API] Validating word:', word);

  if (!word) {
    return NextResponse.json({ error: "Word parameter is required" }, { status: 400 })
  }

  try {
    // Check if there are any words in the database
    const countResult = await query("SELECT COUNT(*) as count FROM words");
    console.log('[Validate Word API] Total words in database:', countResult?.rows?.[0]?.count);
    
    const isValid = await validateWord(word)
    console.log('[Validate Word API] Word validation result:', { word, isValid });
    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error("Error validating word:", error)
    return NextResponse.json({ error: "Failed to validate word" }, { status: 500 })
  }
}
