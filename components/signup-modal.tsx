"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus } from "lucide-react"

export function SignupModal() {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { toast } = useToast()

  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return false
    }

    if (username.length < 3 || username.length > 20) {
      toast({
        title: "Invalid username",
        description: "Username must be between 3 and 20 characters",
        variant: "destructive",
      })
      return false
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      toast({
        title: "Invalid username",
        description: "Username can only contain letters, numbers, and underscores",
        variant: "destructive",
      })
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return false
    }

    if (password.length < 8) {
      toast({
        title: "Weak password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      })
      return false
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await register(username, email, password, displayName || username)
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully",
        variant: "default",
      })
      setOpen(false)
      setUsername("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      setDisplayName("")
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again with different credentials",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="wood-button text-amber-900 font-semibold">
          <UserPlus className="h-4 w-4 mr-2" />
          Sign Up
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-4 border-amber-600 bg-green-900/95">
        <DialogHeader>
          <DialogTitle className="text-amber-100 text-2xl font-bold">Join the Game!</DialogTitle>
          <DialogDescription className="text-amber-200">
            Enter your information to create a new account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-amber-200 font-medium">Username *</Label>
            <Input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              className="bg-green-800/50 border-amber-600 text-amber-100 placeholder:text-amber-400 focus:border-amber-400 focus:ring-amber-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-amber-200 font-medium">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your display name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              className="bg-green-800/50 border-amber-600 text-amber-100 placeholder:text-amber-400 focus:border-amber-400 focus:ring-amber-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-amber-200 font-medium">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="bg-green-800/50 border-amber-600 text-amber-100 placeholder:text-amber-400 focus:border-amber-400 focus:ring-amber-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-amber-200 font-medium">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="bg-green-800/50 border-amber-600 text-amber-100 placeholder:text-amber-400 focus:border-amber-400 focus:ring-amber-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-amber-200 font-medium">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              className="bg-green-800/50 border-amber-600 text-amber-100 placeholder:text-amber-400 focus:border-amber-400 focus:ring-amber-400"
            />
          </div>
          <Button type="submit" className="w-full wood-button text-amber-900 font-semibold py-3" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
