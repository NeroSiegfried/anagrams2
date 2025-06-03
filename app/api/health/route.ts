import { NextResponse } from "next/server"
import { getDatabaseStatus } from "@/lib/db"

export async function GET() {
  try {
    const { available, error } = getDatabaseStatus()

    if (!available) {
      return NextResponse.json(
        {
          status: "offline",
          database: "not_available",
          message: error || "Database not configured",
        },
        { status: 503 },
      )
    }

    // Try a simple query to verify connection using the correct Neon syntax
    const { query } = await import("@/lib/db")
    await query("SELECT 1")

    return NextResponse.json({
      status: "ok",
      database: "connected",
      message: "Database is available and responding",
    })
  } catch (error: any) {
    console.error("Database health check failed:", error)

    return NextResponse.json(
      {
        status: "error",
        database: "connection_failed",
        message: "Database connection failed",
      },
      { status: 503 },
    )
  }
}
