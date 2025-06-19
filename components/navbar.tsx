"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Home, Settings, User, LogIn, Menu, X, GamepadIcon as GameController, Users } from "lucide-react"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"

interface NavbarProps {
  onSettingsClick?: () => void
}

export function Navbar({ onSettingsClick }: NavbarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  const isActive = (path: string) => {
    return pathname === path
  }

  const isInGame = pathname === "/play" || pathname.startsWith("/play/")

  const handleSettingsClick = () => {
    if (isInGame && onSettingsClick) {
      onSettingsClick()
    } else {
      // Navigate to settings page (client-side)
      router.push("/settings")
    }
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-green-900/80 backdrop-blur-sm border-b border-amber-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <span className="text-amber-300 font-bold text-xl">ANAGRAMS</span>
              </Link>
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-4">
                <Link href="/">
                  <Button
                    variant={isActive("/") ? "default" : "ghost"}
                    className={
                      isActive("/") ? "bg-amber-600 text-white hover:bg-amber-700" : "text-amber-300 hover:bg-green-800"
                    }
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </Link>

                <Link href="/play">
                  <Button
                    variant={isActive("/play") ? "default" : "ghost"}
                    className={
                      isActive("/play")
                        ? "bg-amber-600 text-white hover:bg-amber-700"
                        : "text-amber-300 hover:bg-green-800"
                    }
                  >
                    <GameController className="h-4 w-4 mr-2" />
                    Play
                  </Button>
                </Link>

                <Link href="/play/multiplayer">
                  <Button
                    variant={isActive("/play/multiplayer") ? "default" : "ghost"}
                    className={
                      isActive("/play/multiplayer")
                        ? "bg-amber-600 text-white hover:bg-amber-700"
                        : "text-amber-300 hover:bg-green-800"
                    }
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Multiplayer
                  </Button>
                </Link>

                <Button
                  variant={isActive("/settings") ? "default" : "ghost"}
                  className={
                    isActive("/settings")
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : "text-amber-300 hover:bg-green-800"
                  }
                  onClick={handleSettingsClick}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>

                {user ? (
                  <Link href="/profile">
                    <Button
                      variant={isActive("/profile") ? "default" : "ghost"}
                      className={
                        isActive("/profile")
                          ? "bg-amber-600 text-white hover:bg-amber-700"
                          : "text-amber-300 hover:bg-green-800"
                      }
                    >
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="ghost"
                    className="text-amber-300 hover:bg-green-800"
                    onClick={() => setShowLogin(true)}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                )}
              </div>
            </div>

            <div className="md:hidden">
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
                    <GameController className="h-4 w-4 mr-2" />
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

                {user ? (
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
                        logout()
                        setMobileMenuOpen(false)
                      }}
                    >
                      <LogIn className="h-4 w-4 mr-2 rotate-180" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-amber-300 hover:bg-green-800"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      setShowLogin(true)
                    }}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence>
        {showLogin && (
          <LoginModal
            onClose={() => setShowLogin(false)}
            onSignupClick={() => {
              setShowLogin(false)
              setShowSignup(true)
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSignup && (
          <SignupModal
            onClose={() => setShowSignup(false)}
            onLoginClick={() => {
              setShowSignup(false)
              setShowLogin(true)
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
