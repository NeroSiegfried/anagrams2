import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth-service'

export async function POST(request: NextRequest) {
  try {
    const { sessionToken } = await request.json()

    if (sessionToken) {
      await authService.deleteSession(sessionToken)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 