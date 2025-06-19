import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth-service'

export async function PUT(request: NextRequest) {
  try {
    const preferences = await request.json()
    
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 401 }
      )
    }

    // Validate session
    const session = await authService.getSession(sessionToken)
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Update preferences
    const updatedPreferences = await authService.updateUserPreferences(session.userId, preferences)

    return NextResponse.json(updatedPreferences)

  } catch (error: any) {
    console.error('Update preferences error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 