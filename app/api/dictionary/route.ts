import { NextResponse } from "next/server"
import { getWordDefinition } from "@/lib/word-service"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const word = searchParams.get("word")?.toLowerCase()

  if (!word) {
    return NextResponse.json({ error: "Word parameter is required" }, { status: 400 })
  }

  try {
    const definition = await getWordDefinition(word)

    if (!definition) {
      // Generate a generic definition for words not in our database
      const genericDefinition = {
        word: word,
        phonetic: `/${word}/`,
        meanings: [
          {
            partOfSpeech: Math.random() > 0.5 ? "noun" : "verb",
            definitions: [
              {
                definition: `A ${word} is a common English word.`,
                example: `The ${word} was used in a sentence.`,
              },
            ],
          },
        ],
      }

      return NextResponse.json(genericDefinition)
    }

    // Parse the stored definition JSON
    try {
      const parsedDefinition = JSON.parse(definition)
      return NextResponse.json(parsedDefinition)
    } catch {
      // If parsing fails, return a simple definition object
      return NextResponse.json({
        word: word,
        phonetic: `/${word}/`,
        meanings: [
          {
            partOfSpeech: "noun",
            definitions: [
              {
                definition: definition,
              },
            ],
          },
        ],
      })
    }
  } catch (error) {
    console.error("Error fetching definition:", error)
    return NextResponse.json({ error: "Failed to fetch definition" }, { status: 500 })
  }
}
