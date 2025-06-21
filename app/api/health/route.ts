import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection with a simple query
    const result = await query('SELECT 1 as test')
    
    if (result && result.rows && result.rows.length > 0) {
      return NextResponse.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: 'connected'
      })
    } else {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Database query failed',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'Database connection failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 