import { NextResponse } from "next/server"
import { createUser } from "@/lib/user-service"

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const user = await createUser(username, email, password)

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error("Signup error:", error)

    // Check for duplicate key violation
    if (error.message?.includes("duplicate key")) {
      if (error.message.includes("username")) {
        return NextResponse.json({ error: "Username already exists" }, { status: 409 })
      }
      if (error.message.includes("email")) {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 })
      }
    }

    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
