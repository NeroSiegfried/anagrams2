import { NextResponse } from "next/server"
import { seedWords } from "@/lib/seed-words"

// This endpoint should be protected in production
export async function POST(request: Request) {
  try {
    await seedWords()
    return NextResponse.json({ success: true, message: "Words seeded successfully" })
  } catch (error) {
    console.error("Error seeding words:", error)
    return NextResponse.json({ error: "Failed to seed words" }, { status: 500 })
  }
}
