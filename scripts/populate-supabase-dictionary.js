// This script populates the Supabase dictionary with words
// Run with: node scripts/populate-supabase-dictionary.js
require("dotenv").config({ path: ".env.local" })
const { createClient } = require("@supabase/supabase-js")

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_SUPABASE_URL
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

    const processed = 0
    const added = 0
    const errors = 0
    const batchSize = 100
    const batch = []

    for (const [word, wordEntries] of wordMap) {
