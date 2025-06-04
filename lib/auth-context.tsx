"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface AuthContextType {
  user: User | null
  session: Session | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, username: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
  dbError: boolean
  updateProfile: (username: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(false)
  const { toast } = useToast()

  // Load user from Supabase session on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = getSupabaseClient()

        if (!supabase) {
          console.log("Supabase not configured - running in offline mode")
          setDbError(true)
          setLoading(false)
          return
        }

        // Get current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error loading session:", error)
          setDbError(true)
        } else if (session) {
          setSession(session)
          setUser(session.user)
        }

        // Set up auth state change listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSession(newSession)
          setUser(newSession?.user ?? null)
        })

        setDbError(false)

        // Cleanup subscription on unmount
        return () => {
          subscription.unsubscribe()
        }
      } catch (error: any) {
        console.error("Error loading user:", error)
        setDbError(true)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true)

      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client not available")
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      setSession(data.session)
      setUser(data.user)
      setDbError(false)

      toast({
        title: "Login successful",
        description: "Welcome back!",
      })
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email: string, password: string, username: string): Promise<void> => {
    try {
      setLoading(true)

      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client not available")
      }

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (error) {
        throw error
      }

      setSession(data.session)
      setUser(data.user)
      setDbError(false)

      toast({
        title: "Account created",
        description: "Welcome to Anagrams!",
      })
    } catch (error: any) {
      console.error("Signup error:", error)
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client not available")
      }

      await supabase.auth.signOut()
      setUser(null)
      setSession(null)

      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      })
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      })
    }
  }

  const updateProfile = async (username: string): Promise<void> => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase || !user) {
        throw new Error("Supabase client or user not available")
      }

      const { error } = await supabase.auth.updateUser({
        data: { username },
      })

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error: any) {
      console.error("Profile update error:", error)
      toast({
        title: "Profile update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        login,
        signup,
        logout,
        loading,
        dbError,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
