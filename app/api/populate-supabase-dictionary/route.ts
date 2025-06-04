import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    console.log("Starting Supabase dictionary population...")

    const supabase = createServerSupabaseClient()

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase client not available",
          details: "Server-side Supabase client could not be created. Check environment variables.",
        },
        { status: 500 },
      )
    }

    // Test the connection first
    const { data: testData, error: testError } = await supabase
      .from("words")
      .select("count")
      .limit(1)

    if (testError) {
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          details: `${testError.message}. Make sure you've run the SQL setup script first.`,
        },
        { status: 500 },
      )
    }

    // First, let's add some basic words to test the connection
    const basicWords = [
      {
        word: "cat",
        length: 3,
        is_common: true,
        definition:
          '{"word":"cat","meanings":[{"partOfSpeech":"noun","definitions":[{"definition":"A small domesticated carnivorous mammal"}]}]}',
      },
      {
        word: "dog",
        length: 3,
        is_common: true,
        definition:
          '{"word":"dog","meanings":[{"partOfSpeech":"noun","definitions":[{"definition":"A domesticated carnivorous mammal"}]}]}',
      },
      {
        word: "run",
        length: 3,
        is_common: true,
        definition:
          '{"word":"run","meanings":[{"partOfSpeech":"verb","definitions":[{"definition":"Move at a speed faster than a walk"}]}]}',
      },
      {
        word: "game",
        length: 4,
        is_common: true,
        definition:
          '{"word":"game","meanings":[{"partOfSpeech":"noun","definitions":[{"definition":"A form of play or sport"}]}]}',
      },
      {
        word: "play",
        length: 4,
        is_common: true,
        definition:
          '{"word":"play","meanings":[{"partOfSpeech":"verb","definitions":[{"definition":"Engage in activity for enjoyment"}]}]}',
      },
      {
        word: "word",
        length: 4,
        is_common: true,
        definition:
          '{"word":"word","meanings":[{"partOfSpeech":"noun","definitions":[{"definition":"A single distinct meaningful element of speech"}]}]}',
      },
      {
        word: "anagram",
        length: 7,
        is_common: true,
        definition:
          '{"word":"anagram","meanings":[{"partOfSpeech":"noun","definitions":[{"definition":"A word formed by rearranging the letters of another word"}]}]}',
      },
      {
        word: "puzzle",
        length: 6,
        is_common: true,
        definition:
          '{"word":"puzzle","meanings":[{"partOfSpeech":"noun","definitions":[{"definition":"A game or problem designed to test ingenuity"}]}]}',
      },
      {
        word: "letter",
        length: 6,
        is_common: true,
        definition:
          '{"word":"letter","meanings":[{"partOfSpeech":"noun","definitions":[{"definition":"A character representing a sound in speech"}]}]}',
      },
      {
        word: "player",
        length: 6,
        is_common: true,
        definition:
          '{"word":"player","meanings":[{"partOfSpeech":"noun","definitions":[{"definition":"A person who plays a game or sport"}]}]}',
      },
    ]

    let added = 0
    let errors = 0

    for (const wordData of basicWords) {
      try {
        // Create canonical form for anagram matching
        const canonicalForm = wordData.word.toLowerCase().split("").sort().join("")

        const { error } = await supabase.from("words").upsert({
          word: wordData.word.toLowerCase(),
          length: wordData.length,
          is_common: wordData.is_common,
          definition: wordData.definition,
          canonical_form: canonicalForm,
        })

        if (error) {
          console.error(`Error adding word "${wordData.word}":`, error)
          errors++
        } else {
          added++
        }
      } catch (error) {
        console.error(`Error processing word "${wordData.word}":`, error)
        errors++
      }
    }

    // Try to fetch a larger dictionary if the basic words were successful
    if (added > 0) {
      try {
        console.log("Fetching larger dictionary...")
        const response = await fetch(
          "https://raw.githubusercontent.com/benjihillard/English-Dictionary-Database/refs/heads/main/english%20Dictionary.csv",
        )

        if (response.ok) {
          const csvText = await response.text()
          const entries = parseCsv(csvText)

          // Process in smaller batches
          const batchSize = 50
          let processed = 0

          for (let i = 0; i < Math.min(entries.length, 500); i += batchSize) {
            const batch = entries.slice(i, i + batchSize)
            const batchData = batch.map((entry) => {
              const canonicalForm = entry.word.toLowerCase().split("").sort().join("")
              return {
                word: entry.word.toLowerCase(),
                length: entry.word.length,
                is_common: entry.word.length <= 6,
                definition: JSON.stringify({
                  word: entry.word,
                  meanings: [
                    {
                      partOfSpeech: entry.pos || "unknown",
                      definitions: [{ definition: entry.def || `Definition for ${entry.word}` }],
                    },
                  ],
                }),
                canonical_form: canonicalForm,
              }
            })

            const { error } = await supabase.from("words").upsert(batchData, { onConflict: "word" })

            if (error) {
              console.error(`Error adding batch ${i}:`, error)
              errors += batch.length
            } else {
              added += batch.length
              processed += batch.length
            }

            // Small delay between batches
            await new Promise((resolve) => setTimeout(resolve, 100))
          }

          console.log(`Processed ${processed} additional words from CSV`)
        }
      } catch (error) {
        console.error("Error fetching/processing CSV dictionary:", error)
      }
    }

    console.log(`Dictionary population complete! Added: ${added}, Errors: ${errors}`)

    return NextResponse.json({
      success: true,
      message: "Dictionary populated successfully",
      stats: {
        successfullyAdded: added,
        errors: errors,
      },
    })
  } catch (error) {
    console.error("Failed to populate dictionary:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to populate dictionary",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function parseCsv(csvText: string) {
  const lines = csvText.split("\n")
  const entries: any[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV line - handle quoted fields that may contain commas
    const fields = parseCsvLine(line)

    if (fields.length >= 3) {
      const word = fields[0].trim().toLowerCase()
      const pos = fields[1].trim()
      const def = fields[2].trim()

      // Only include words that are 3+ letters and contain only letters
      if (word.length >= 3 && word.length <= 15 && /^[a-z]+$/.test(word)) {
        entries.push({ word, pos, def })
      }
    }
  }

  return entries
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === "," && !inQuotes) {
      // Field separator
      fields.push(current)
      current = ""
      i++
    } else {
      current += char
      i++
    }
  }

  // Add the last field
  fields.push(current)

  return fields.map((field) => field.replace(/^"|"$/g, "")) // Remove surrounding quotes
}
