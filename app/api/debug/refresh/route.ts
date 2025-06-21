import { NextRequest, NextResponse } from 'next/server'
import { resetConnection } from '@/lib/db'

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    // Reset database connection cache
    resetConnection()
    
    // Clear any module cache if needed
    if (typeof global.gc === 'function') {
      global.gc()
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Server state refreshed',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Debug Refresh] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to refresh server state', 
      details: String(error) 
    }, { status: 500 })
  }
} 