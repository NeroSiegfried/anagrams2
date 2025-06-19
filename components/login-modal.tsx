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
import { Loader2, LogIn } from "lucide-react"

export function LoginModal() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in",
        variant: "default",
      })
      setOpen(false)
      setEmail("")
      setPassword("")
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
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
          <LogIn className="h-4 w-4 mr-2" />
          Login
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-4 border-amber-600 bg-green-900/95">
        <DialogHeader>
          <DialogTitle className="text-amber-100 text-2xl font-bold">Welcome Back!</DialogTitle>
          <DialogDescription className="text-amber-200">
            Enter your credentials to access your account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-amber-200 font-medium">Email</Label>
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
            <Label htmlFor="password" className="text-amber-200 font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="bg-green-800/50 border-amber-600 text-amber-100 placeholder:text-amber-400 focus:border-amber-400 focus:ring-amber-400"
            />
          </div>
          <Button type="submit" className="w-full wood-button text-amber-900 font-semibold py-3" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
