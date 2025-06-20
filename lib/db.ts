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

// Helper function for raw SQL queries
export async function query(sqlQuery: string, params: any[] = []) {
  const { sql: connection, error } = initializeDatabase()

  if (error || !connection) {
    throw new Error(`Database not available: ${error || "No connection"}`)
  }

  try {
    console.log('Executing query:', sqlQuery, 'with params:', params)
    const result = await connection(sqlQuery, params)
    console.log('Raw Neon result:', result)
    console.log('Result type:', typeof result)
    console.log('Result keys:', Object.keys(result || {}))
    
    // Handle different result formats
    if (result && result.rows) {
      return { rows: result.rows }
    } else if (Array.isArray(result)) {
      return { rows: result }
    } else if (result && typeof result === 'object') {
      // If result is already in the expected format
      return result
    } else {
      console.error('Unexpected result format:', result)
      return { rows: [] }
    }
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
