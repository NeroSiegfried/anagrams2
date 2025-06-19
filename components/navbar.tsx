"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings, Home, Gamepad2, Users, Menu, X, LogIn } from "lucide-react"
import Link from "next/link"

interface NavbarProps {
  onSettingsClick?: () => void
}

export function Navbar({ onSettingsClick }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, loading } = useAuth()
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const isActive = (path: string) => {
    return pathname === path
  }

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick()
    } else {
      // Navigate to settings page if no callback provided
      router.push('/settings')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-green-900 border-b border-amber-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-amber-100 text-xl font-bold">
                Anagrams
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <Link href="/">
                <Button
                  variant={isActive("/") ? "default" : "ghost"}
                  className={`h-10 ${
                    isActive("/")
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : "text-amber-300 hover:bg-green-800"
                  }`}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>

              <Link href="/play">
                <Button
                  variant={isActive("/play") ? "default" : "ghost"}
                  className={`h-10 ${
                    isActive("/play")
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : "text-amber-300 hover:bg-green-800"
                  }`}
                >
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  Play
                </Button>
              </Link>

              <Link href="/play/multiplayer">
                <Button
                  variant={isActive("/play/multiplayer") ? "default" : "ghost"}
                  className={`h-10 ${
                    isActive("/play/multiplayer")
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : "text-amber-300 hover:bg-green-800"
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Multiplayer
                </Button>
              </Link>

              <Button
                variant={isActive("/settings") ? "default" : "ghost"}
                className={`h-10 ${
                  isActive("/settings")
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "text-amber-300 hover:bg-green-800"
                }`}
                onClick={handleSettingsClick}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex md:items-center md:space-x-4">
              {!isHydrated ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              ) : loading ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || undefined} alt={user.displayName || user.username} />
                        <AvatarFallback>
                          {getInitials(user.displayName || user.username)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 game-card border-4 border-amber-600 bg-green-900/95 z-50" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal border-b border-amber-600 pb-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-amber-100">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-xs leading-none text-amber-300">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-amber-600" />
                    <DropdownMenuItem asChild className="text-amber-200 hover:bg-amber-600 hover:text-amber-900 focus:bg-amber-600 focus:text-amber-900">
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-amber-600" />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-300 hover:bg-red-600 hover:text-white focus:bg-red-600 focus:text-white">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <LoginModal />
                  <SignupModal />
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              className="text-amber-300 hover:bg-green-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden bg-green-900 border-b border-amber-600"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={isActive("/") ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isActive("/") ? "bg-amber-600 text-white hover:bg-amber-700" : "text-amber-300 hover:bg-green-800"
                  }`}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>

              <Link href="/play" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={isActive("/play") ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isActive("/play")
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : "text-amber-300 hover:bg-green-800"
                  }`}
                >
                  <Gamepad2 className="h-4 w-4 mr-2" />
                  Play
                </Button>
              </Link>

              <Link href="/play/multiplayer" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant={isActive("/play/multiplayer") ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isActive("/play/multiplayer")
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : "text-amber-300 hover:bg-green-800"
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Multiplayer
                </Button>
              </Link>

              <Button
                variant={isActive("/settings") ? "default" : "ghost"}
                className={`w-full justify-start ${
                  isActive("/settings")
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "text-amber-300 hover:bg-green-800"
                }`}
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleSettingsClick()
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>

              {!isHydrated ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              ) : loading ? (
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              ) : user ? (
                <>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant={isActive("/profile") ? "default" : "ghost"}
                      className={`w-full justify-start ${
                        isActive("/profile")
                          ? "bg-amber-600 text-white hover:bg-amber-700"
                          : "text-amber-300 hover:bg-green-800"
                      }`}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-300 hover:bg-red-900/30"
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                  >
                    <LogIn className="h-4 w-4 mr-2 rotate-180" />
                    Logout
                  </Button>
                </>
              ) : (
                <div className="flex flex-col space-y-2">
                  <LoginModal />
                  <SignupModal />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
