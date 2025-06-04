import { NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return NextResponse.json(
        {
          status: "offline",
          database: "not_available",
          message: "Supabase client not configured",
        },
        { status: 503 },
      )
    }

    // Try a simple query to verify connection
    const { data, error } = await supabase.from("words").select("count").limit(1)

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          database: "connection_failed",
          message: "Supabase connection failed",
          error: error.message,
        },
        { status: 503 },
      )
    }

    return NextResponse.json({
      status: "ok",
      database: "connected",
      message: "Supabase is available and responding",
    })
  } catch (error: any) {
    console.error("Database health check failed:", error)

    return NextResponse.json(
      {
        status: "error",
        database: "connection_failed",
        message: "Database connection failed",
        error: error.message,
      },
      { status: 503 },
    )
  }
}
