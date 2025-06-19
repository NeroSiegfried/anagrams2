"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, UserPreferences } from './auth-service'

interface AuthContextType {
  user: User | null
  session: Session | null
  preferences: UserPreferences | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
  updatePreferences: (preferences: Partial<Omit<UserPreferences, 'id' | 'userId'>>) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionToken = getSessionToken()
        if (sessionToken) {
          // Call API to validate session
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionToken })
          })
          
          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
            setSession(data.session)
            setPreferences(data.preferences)
          } else {
            // Invalid session - clear it
            clearSessionToken()
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
        clearSessionToken()
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()
      setUser(data.user)
      setSession(data.session)
      setPreferences(data.preferences)
      
      // Store session token
      setSessionToken(data.session.sessionToken)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (username: string, email: string, password: string, displayName?: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, displayName })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Registration failed')
      }

      const data = await response.json()
      setUser(data.user)
      setPreferences(data.preferences)
      
      // Auto-login after registration
      await login(email, password)
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      if (session) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken: session.sessionToken })
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setSession(null)
      setPreferences(null)
      clearSessionToken()
    }
  }

  const updatePreferences = async (newPreferences: Partial<Omit<UserPreferences, 'id' | 'userId'>>) => {
    if (!user || !session) throw new Error('User not authenticated')
    
    try {
      const response = await fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.sessionToken}`
        },
        body: JSON.stringify(newPreferences)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update preferences')
      }

      const updatedPreferences = await response.json()
      setPreferences(updatedPreferences)
    } catch (error) {
      console.error('Update preferences error:', error)
      throw error
    }
  }

  const refreshUser = async () => {
    if (!user || !session) return
    
    try {
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${session.sessionToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  }

  // Session token management
  const setSessionToken = (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('anagrams_session_token', token)
    }
  }

  const getSessionToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('anagrams_session_token')
    }
    return null
  }

  const clearSessionToken = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('anagrams_session_token')
    }
  }

  const value: AuthContextType = {
    user,
    session,
    preferences,
    loading,
    login,
    register,
    logout,
    updatePreferences,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
