import bcrypt from 'bcryptjs'
import { randomBytes, randomUUID } from 'crypto'
import { query } from './db'

export interface User {
  id: string
  username: string
  email: string
  displayName?: string
  avatar?: string
  isVerified: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface UserWithPassword extends User {
  password: string
}

export interface Session {
  id: string
  sessionToken: string
  userId: string
  expires: Date
}

export interface Account {
  id: string
  userId: string
  type: string
  provider: string
  providerAccountId: string
  refreshToken?: string
  accessToken?: string
  expiresAt?: number
  tokenType?: string
  scope?: string
  idToken?: string
  sessionState?: string
}

export interface UserPreferences {
  id: string
  userId: string
  letterCount: number
  roundDuration: number
  soundEnabled: boolean
  musicEnabled: boolean
  theme: string
  language: string
  notifications: boolean
}

export class AuthService {
  private static instance: AuthService

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // User registration
  async registerUser(
    username: string,
    email: string,
    password: string,
    displayName?: string
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await this.getUserByEmail(email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    const existingUsername = await this.getUserByUsername(username)
    if (existingUsername) {
      throw new Error('Username already taken')
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const userId = randomUUID()
    const result = await query(
      `INSERT INTO users (id, username, email, password, display_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, username, email, display_name, avatar, is_verified, last_login_at, created_at, updated_at`,
      [userId, username, email, hashedPassword, displayName || username]
    )

    const user = result.rows[0]

    // Create default user preferences
    await this.createUserPreferences(userId)

    return this.mapRowToUser(user)
  }

  // User login
  async loginUser(email: string, password: string): Promise<{ user: User; session: Session }> {
    const user = await this.getUserWithPasswordByEmail(email)
    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw new Error('Invalid email or password')
    }

    // Update last login
    await query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    )

    // Create session
    const session = await this.createSession(user.id)

    return {
      user: this.mapRowToUser(user),
      session
    }
  }

  // OAuth account linking (for future OAuth implementation)
  async linkOAuthAccount(
    userId: string,
    provider: string,
    providerAccountId: string,
    accessToken?: string,
    refreshToken?: string,
    expiresAt?: number,
    scope?: string,
    idToken?: string,
    sessionState?: string
  ): Promise<Account> {
    const accountId = randomUUID()
    const result = await query(
      `INSERT INTO accounts (id, user_id, type, provider, provider_account_id, access_token, refresh_token, expires_at, scope, id_token, session_state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        accountId,
        userId,
        'oauth',
        provider,
        providerAccountId,
        accessToken,
        refreshToken,
        expiresAt,
        scope,
        idToken,
        sessionState
      ]
    )

    return this.mapRowToAccount(result.rows[0])
  }

  // Session management
  async createSession(userId: string): Promise<Session> {
    const sessionToken = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const result = await query(
      `INSERT INTO sessions (id, session_token, user_id, expires)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [randomUUID(), sessionToken, userId, expires]
    )

    return this.mapRowToSession(result.rows[0])
  }

  async getSession(sessionToken: string): Promise<Session | null> {
    const result = await query(
      'SELECT * FROM sessions WHERE session_token = $1 AND expires > CURRENT_TIMESTAMP',
      [sessionToken]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToSession(result.rows[0])
  }

  async deleteSession(sessionToken: string): Promise<void> {
    await query('DELETE FROM sessions WHERE session_token = $1', [sessionToken])
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await query('DELETE FROM sessions WHERE user_id = $1', [userId])
  }

  // User management
  async getUserById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT id, username, email, display_name, avatar, is_verified, last_login_at, created_at, updated_at FROM users WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToUser(result.rows[0])
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT id, username, email, display_name, avatar, is_verified, last_login_at, created_at, updated_at FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToUser(result.rows[0])
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await query(
      'SELECT id, username, email, display_name, avatar, is_verified, last_login_at, created_at, updated_at FROM users WHERE username = $1',
      [username]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToUser(result.rows[0])
  }

  private async getUserWithPasswordByEmail(email: string): Promise<UserWithPassword | null> {
    const result = await query(
      'SELECT id, username, email, password, display_name, avatar, is_verified, last_login_at, created_at, updated_at FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToUserWithPassword(result.rows[0])
  }

  // User preferences
  async createUserPreferences(userId: string): Promise<UserPreferences> {
    const result = await query(
      `INSERT INTO user_preferences (id, user_id, letter_count, round_duration, sound_enabled, music_enabled, theme, language, notifications)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [randomUUID(), userId, 6, 60, true, true, 'light', 'en', true]
    )

    return this.mapRowToUserPreferences(result.rows[0])
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const result = await query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToUserPreferences(result.rows[0])
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<Omit<UserPreferences, 'id' | 'userId'>>
  ): Promise<UserPreferences> {
    const fields = Object.keys(preferences)
    const values = Object.values(preferences)
    const setClause = fields.map((field, index) => `${this.camelToSnake(field)} = $${index + 2}`).join(', ')

    const result = await query(
      `UPDATE user_preferences SET ${setClause} WHERE user_id = $1 RETURNING *`,
      [userId, ...values]
    )

    return this.mapRowToUserPreferences(result.rows[0])
  }

  // Utility methods
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      displayName: row.display_name,
      avatar: row.avatar,
      isVerified: row.is_verified,
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  private mapRowToUserWithPassword(row: any): UserWithPassword {
    return {
      ...this.mapRowToUser(row),
      password: row.password
    }
  }

  private mapRowToSession(row: any): Session {
    return {
      id: row.id,
      sessionToken: row.session_token,
      userId: row.user_id,
      expires: new Date(row.expires)
    }
  }

  private mapRowToAccount(row: any): Account {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      provider: row.provider,
      providerAccountId: row.provider_account_id,
      refreshToken: row.refresh_token,
      accessToken: row.access_token,
      expiresAt: row.expires_at,
      tokenType: row.token_type,
      scope: row.scope,
      idToken: row.id_token,
      sessionState: row.session_state
    }
  }

  private mapRowToUserPreferences(row: any): UserPreferences {
    return {
      id: row.id,
      userId: row.user_id,
      letterCount: row.letter_count,
      roundDuration: row.round_duration,
      soundEnabled: row.sound_enabled,
      musicEnabled: row.music_enabled,
      theme: row.theme,
      language: row.language,
      notifications: row.notifications
    }
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
  }
}

export const authService = AuthService.getInstance() 