// This script populates the Supabase dictionary with words
// Run with: node scripts/populate-supabase-dictionary.js
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or service key")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fetchAndParseDictionary() {
  console.log("Fetching dictionary from GitHub...")

  const response = await fetch(
    "https://raw.githubusercontent.com/benjihillard/English-Dictionary-Database/refs/heads/main/english%20Dictionary.csv",
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch dictionary: ${response.status} ${response.statusText}`)
  }

  const csvText = await response.text()
  console.log(`Downloaded ${csvText.length} characters of CSV data`)

  return parseCsv(csvText)
}

function parseCsv(csvText) {
  const lines = csvText.split("\n")
  const entries = []

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

  console.log(`Parsed ${entries.length} valid dictionary entries`)
  return entries
}

function parseCsvLine(line) {
  const fields = []
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

function extractExample(definition) {
  // Try to extract quoted examples from the definition
  const quoteMatch = definition.match(/"([^"]+)"/)
  return quoteMatch ? quoteMatch[1] : undefined
}

async function populateDictionary() {
  try {
    console.log("Starting dictionary population...")

    const entries = await fetchAndParseDictionary()

    // Group entries by word to handle multiple definitions
    const wordMap = new Map()

    for (const entry of entries) {
      if (!wordMap.has(entry.word)) {
        wordMap.set(entry.word, [])
      }
      wordMap.get(entry.word).push(entry)
    }

    console.log(`Processing ${wordMap.size} unique words...`)

    let processed = 0
    let added = 0
    let errors = 0
    const batchSize = 100
    let batch = []

    for (const [word, wordEntries] of wordMap) {
      try {
        // Combine all definitions for this word
        const combinedDefinitions = wordEntries.map((entry) => {
          const pos = entry.pos || "unknown"
          const def = entry.def || `Definition for ${word}`
          return { partOfSpeech: pos, definition: def }
        })

        // Create a comprehensive definition object
        const definitionObj = {
          word: word,
          phonetic: `/${word}/`,
          meanings: combinedDefinitions.reduce((acc, curr) => {
            // Group by part of speech
            const existing = acc.find((m) => m.partOfSpeech === curr.partOfSpeech)
            if (existing) {
              existing.definitions.push({
                definition: curr.definition,
                example: curr.definition.includes('"') ? extractExample(curr.definition) : undefined,
              })
            } else {
              acc.push({
                partOfSpeech: curr.partOfSpeech,
                definitions: [
                  {
                    definition: curr.definition,
                    example: curr.definition.includes('"') ? extractExample(curr.definition) : undefined,
                  },
                ],
              })
            }
            return acc
          }, []),
        }

        const definitionJson = JSON.stringify(definitionObj)

        // Determine if this is a common word (simple heuristic)
        const isCommon = word.length <= 8 && !word.includes("'") && !/[A-Z]/.test(word)

        // Create canonical form for anagram matching
        const canonicalForm = word.toLowerCase().split("").sort().join("")

        // Add to batch
        batch.push({
          word: word.toLowerCase(),
          length: word.length,
          is_common: isCommon,
          definition: definitionJson,
          canonical_form: canonicalForm,
        })

        processed++

        // If batch is full, send it to Supabase
        if (batch.length >= batchSize) {
          const { data, error } = await supabase.from("words").upsert(batch, { onConflict: "word" })

          if (error) {
            console.error(`Error inserting batch:`, error)
            errors += batch.length
          } else {
            added += batch.length
          }
          batch = [] // clear batch

          if (processed % 1000 === 0) {
            console.log(`Processed ${processed}/${wordMap.size} words (${added} added, ${errors} errors)`)
          }
        }
      } catch (error) {
        errors++
        if (errors <= 10) {
          // Only log first 10 errors to avoid spam
          console.error(`Error adding word "${word}":`, error)
        }
      }

      // Add a small delay every 100 words to prevent overwhelming the database
      if (processed % 100 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    }

    // Insert any remaining rows in the final batch
    if (batch.length > 0) {
      const { data, error } = await supabase.from("words").upsert(batch, { onConflict: "word" })

      if (error) {
        console.error("Error inserting final batch:", error)
        errors += batch.length
      } else {
        added += batch.length
      }
    }

    console.log(`Dictionary population complete!`)
    console.log(`Total processed: ${processed}`)
    console.log(`Successfully added: ${added}`)
    console.log(`Errors: ${errors}`)

    return {
      totalProcessed: processed,
      successfullyAdded: added,
      errors: errors,
    }
  } catch (error) {
    console.error("Failed to populate dictionary:", error)
    throw error
  }
}

// Check if this script is being run directly
if (require.main === module) {
  // Load environment variables if running directly
  populateDictionary()
    .then((stats) => {
      console.log("Dictionary population completed successfully!")
      console.log("Stats:", stats)
      process.exit(0)
    })
    .catch((error) => {
      console.error("Dictionary population failed:", error)
      process.exit(1)
    })
} else {
  // Export for use in API routes
  module.exports = { populateDictionary }
}
