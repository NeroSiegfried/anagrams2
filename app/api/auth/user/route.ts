import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth-service'

export async function GET(request: NextRequest) {
  try {
    // Get session token from Authorization header or query param
    const authHeader = request.headers.get('authorization')
    const sessionToken = authHeader?.replace('Bearer ', '') || 
                        new URL(request.url).searchParams.get('sessionToken')

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

    // Get user and preferences
    const user = await authService.getUserById(session.userId)
    const preferences = await authService.getUserPreferences(session.userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        isVerified: user.isVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      },
      preferences
    })

  } catch (error: any) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 