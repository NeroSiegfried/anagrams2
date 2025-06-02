"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  username: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  signup: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Load user from localStorage on initial render
  useEffect(() => {
    const savedUser = localStorage.getItem("anagramsUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = async (username: string, password: string): Promise<void> => {
    try {
      // In a real implementation, this would validate credentials against a server
      // For demo purposes, we'll simulate a successful login

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check if username and password are valid (mock validation)
      if (username.length < 3 || password.length < 6) {
        throw new Error("Invalid credentials")
      }

      const newUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        username,
        email: `${username}@example.com`, // Mock email
      }

      setUser(newUser)
      localStorage.setItem("anagramsUser", JSON.stringify(newUser))
    } catch (error) {
      throw error
    }
  }

  const signup = async (username: string, email: string, password: string): Promise<void> => {
    try {
      // In a real implementation, this would create a new user on the server
      // For demo purposes, we'll simulate a successful signup

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check if username, email, and password are valid (mock validation)
      if (username.length < 3 || !email.includes("@") || password.length < 6) {
        throw new Error("Invalid signup data")
      }

      const newUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        username,
        email,
      }

      setUser(newUser)
      localStorage.setItem("anagramsUser", JSON.stringify(newUser))
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("anagramsUser")
  }

  return <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
