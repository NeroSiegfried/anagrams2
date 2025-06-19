"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"

interface AuthContextType {
  user: null
  session: null
  signIn: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Only guest mode for now
  const [user] = useState<null>(null)
  const [session] = useState<null>(null)
  const { toast } = useToast()

  const signIn = () => {
    toast({
      title: "Guest Mode",
      description: "Authentication is not enabled.",
      variant: "default",
    })
  }

  const signOut = () => {
    toast({
      title: "Guest Mode",
      description: "Authentication is not enabled.",
      variant: "default",
    })
  }

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut }}>
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
