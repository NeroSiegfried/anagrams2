import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Create a single supabase client for the entire application
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const createSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance

  // Use the correct Supabase environment variable names
  const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL or anon key not found - running in offline mode")
    return null
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

// Server-side client with service role for admin operations
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase URL or service key not found - running in offline mode")
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Client-side singleton pattern
let browserSupabase: ReturnType<typeof createClient<Database>> | null = null

export const getSupabaseClient = () => {
  if (typeof window === "undefined") {
    return createSupabaseClient()
  }

  if (browserSupabase) return browserSupabase

  // For client-side, use the correct environment variable names
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase not configured for client-side - running in offline mode")
    return null
  }

  browserSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
  return browserSupabase
}
