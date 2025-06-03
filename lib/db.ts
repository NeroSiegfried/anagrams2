import { neon } from "@neondatabase/serverless"

let sql: any = null
let dbInitialized = false
let dbError: string | null = null

// Lazy initialization of database connection
function initializeDatabase() {
  if (dbInitialized) {
    return { sql, error: dbError }
  }

  try {
    if (!process.env.DATABASE_URL) {
      dbError = "DATABASE_URL environment variable is not set"
      console.warn("Database not configured - running in offline mode")
      dbInitialized = true
      return { sql: null, error: dbError }
    }

    // Initialize neon with the connection string
    sql = neon(process.env.DATABASE_URL)
    dbError = null
    dbInitialized = true
    console.log("Database connection initialized successfully")
    return { sql, error: null }
  } catch (error) {
    dbError = `Database initialization failed: ${error}`
    console.error("Database initialization error:", error)
    dbInitialized = true
    return { sql: null, error: dbError }
  }
}

// Helper function for raw SQL queries using the correct Neon syntax
export async function query(sqlQuery: string, params: any[] = []) {
  const { sql: connection, error } = initializeDatabase()

  if (error || !connection) {
    throw new Error(`Database not available: ${error || "No connection"}`)
  }

  try {
    // Use the tagged template syntax for Neon
    // Convert the query and params to a tagged template string
    const paramPlaceholders = params.map((_, i) => `$${i + 1}`).join(", ")
    const queryWithParams = sqlQuery.replace(/\$\d+/g, () => "?")

    // For simple queries without parameters
    if (params.length === 0) {
      const result = await connection`${sqlQuery}`
      return { rows: result }
    }

    // For queries with parameters, use sql.query
    const result = await connection.query(sqlQuery, params)
    return { rows: result }
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Check if database is available
export function isDatabaseAvailable(): boolean {
  const { error } = initializeDatabase()
  return !error
}

// Get database status
export function getDatabaseStatus(): { available: boolean; error: string | null } {
  const { error } = initializeDatabase()
  return { available: !error, error }
}
