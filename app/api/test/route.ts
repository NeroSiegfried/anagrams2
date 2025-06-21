import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🧪 TEST API CALLED 🧪');
  return NextResponse.json({ message: 'Test API is working!', timestamp: new Date().toISOString() });
} 