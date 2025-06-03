import { query, isDatabaseAvailable } from "@/lib/db"
import { hash, compare } from "bcrypt"

export interface User {
  id: string
  username: string
  email: string
}

export interface UserWithPassword extends User {
  password_hash: string
}

export async function createUser(username: string, email: string, password: string): Promise<User> {
  if (!isDatabaseAvailable()) {
    throw new Error("Database not available. User accounts are disabled in offline mode.")
  }

  try {
    const hashedPassword = await hash(password, 10)

    const result = await query(
      `INSERT INTO users (username, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, username, email`,
      [username, email, hashedPassword],
    )

    return result.rows[0] as User
  } catch (error: any) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function getUserByUsername(username: string): Promise<UserWithPassword | null> {
  if (!isDatabaseAvailable()) {
    return null
  }

  try {
    const result = await query(
      `SELECT id, username, email, password_hash 
       FROM users 
       WHERE username = $1`,
      [username],
    )

    return result.rows.length > 0 ? (result.rows[0] as UserWithPassword) : null
  } catch (error: any) {
    console.error("Error fetching user by username:", error)
    return null
  }
}

export async function getUserById(id: string): Promise<User | null> {
  if (!isDatabaseAvailable()) {
    return null
  }

  try {
    const result = await query(
      `SELECT id, username, email 
       FROM users 
       WHERE id = $1`,
      [id],
    )

    return result.rows.length > 0 ? (result.rows[0] as User) : null
  } catch (error: any) {
    console.error("Error fetching user by ID:", error)
    return null
  }
}

export async function validateUser(username: string, password: string): Promise<User | null> {
  if (!isDatabaseAvailable()) {
    throw new Error("Database not available. User authentication is disabled in offline mode.")
  }

  try {
    const user = await getUserByUsername(username)

    if (!user) {
      return null
    }

    const isValid = await compare(password, user.password_hash)

    if (!isValid) {
      return null
    }

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error: any) {
    console.error("Error validating user:", error)
    throw error
  }
}

export async function updateUserProfile(
  userId: string,
  data: { username?: string; email?: string },
): Promise<User | null> {
  if (!isDatabaseAvailable()) {
    throw new Error("Database not available. Profile updates are disabled in offline mode.")
  }

  try {
    const updates = []
    const values = []
    let paramCount = 1

    if (data.username) {
      updates.push(`username = $${paramCount}`)
      values.push(data.username)
      paramCount++
    }

    if (data.email) {
      updates.push(`email = $${paramCount}`)
      values.push(data.email)
      paramCount++
    }

    if (updates.length === 0) {
      return getUserById(userId)
    }

    values.push(userId)

    const result = await query(
      `UPDATE users 
       SET ${updates.join(", ")}, updated_at = NOW() 
       WHERE id = $${paramCount} 
       RETURNING id, username, email`,
      values,
    )

    return result.rows.length > 0 ? (result.rows[0] as User) : null
  } catch (error: any) {
    console.error("Error updating user profile:", error)
    throw error
  }
}
