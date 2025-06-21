import { neon } from "@neondatabase/serverless"

let sql: any = null
let connectionCount = 0

// Initialize database connection with better error handling
function getConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  
  // Create a fresh connection for each request in development
  if (process.env.NODE_ENV === 'development') {
    connectionCount++
    console.log(`Creating fresh database connection #${connectionCount}`)
    return neon(process.env.DATABASE_URL)
  }
  
  // In production, reuse connection but with better error handling
  if (!sql) {
    sql = neon(process.env.DATABASE_URL)
    console.log("Database connection initialized")
  }
  return sql
}

// Reset connection cache - useful for debugging
export function resetConnection() {
  sql = null
  connectionCount = 0
  console.log("Database connection cache reset")
}

// Create a fresh connection for critical operations
export function getFreshConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return neon(process.env.DATABASE_URL)
}

// Helper function for raw SQL queries
export async function query(sqlQuery: string, params: any[] = []) {
  const connection = getConnection()

  try {
    console.log('Executing query:', sqlQuery, 'with params:', params)
    const result = await connection(sqlQuery, params)
    console.log('Raw Neon result:', result)
    
    // Handle different result formats
    if (result && result.rows) {
      return { rows: result.rows }
    } else if (Array.isArray(result)) {
      return { rows: result }
    } else if (result && typeof result === 'object') {
      return result
    } else {
      console.error('Unexpected result format:', result)
      return { rows: [] }
    }
  } catch (error) {
    console.error("Database query error:", error)
    // Reset connection on error to force fresh connection
    if (process.env.NODE_ENV === 'development') {
      resetConnection()
    }
    throw error
  }
}

// Check if database is available
export function isDatabaseAvailable(): boolean {
  try {
    getConnection()
    return true
  } catch {
    return false
  }
}

// Get database status
export function getDatabaseStatus(): { available: boolean; error: string | null } {
  try {
    getConnection()
    return { available: true, error: null }
  } catch (error) {
    return { available: false, error: String(error) }
  }
}
