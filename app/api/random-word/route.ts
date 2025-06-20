import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const length = parseInt(searchParams.get("length") || "6", 10)

  if (!length || isNaN(length)) {
    return NextResponse.json({ error: "Length parameter is required and must be a number" }, { status: 400 })
  }

  try {
    // Get a random word of the given length from the database
    const sql = await query(
      `SELECT word FROM words WHERE length = $1 ORDER BY random() LIMIT 1`,
      [length]
    )
    console.log('SQL result:', sql)
    console.log('SQL rows:', sql.rows)
    const word = sql.rows[0]?.word
    if (!word) {
      return NextResponse.json({ error: "No word found of that length" }, { status: 404 })
    }
    return NextResponse.json({ word })
  } catch (error) {
    console.error("Error fetching random word:", error)
    return NextResponse.json({ error: "Failed to fetch random word" }, { status: 500 })
  }
} 