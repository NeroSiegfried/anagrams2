"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, LogIn } from "lucide-react"

interface LoginModalProps {
  onClose: () => void
  onSignupClick?: () => void
}

export function LoginModal({ onClose, onSignupClick }: LoginModalProps) {
  const { login } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      await login(email, password)
      onClose()
    } catch (error) {
      // Error is handled in the auth context
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="game-card border-4 border-amber-600 rounded-xl shadow-2xl p-6 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center mb-6">
          <LogIn className="h-8 w-8 text-amber-300 mr-2" />
          <h2 className="text-2xl font-bold text-amber-100">Log In</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-amber-200">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              className="bg-amber-900/20 border-amber-600 text-amber-100 placeholder:text-amber-400 focus:border-amber-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-amber-200">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              className="bg-amber-900/20 border-amber-600 text-amber-100 placeholder:text-amber-400 focus:border-amber-400"
            />
          </div>

          <Button type="submit" className="w-full wood-button text-amber-900 font-semibold py-3" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </Button>
        </form>

        <div className="mt-4 text-center">
          {onSignupClick && (
            <div className="mb-3 text-amber-200">
              Don't have an account?{" "}
              <button className="text-amber-300 hover:text-amber-100 underline" onClick={onSignupClick}>
                Sign up
              </button>
            </div>
          )}
          <Button variant="link" className="text-amber-300 hover:text-amber-100" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
