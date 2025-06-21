"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { Loader2, User, Trophy, Calendar, Target, Home, LogOut } from "lucide-react"

interface GameHistory {
  id: string
  date: string
  score: number
  wordsFound: number
}

export function UserProfile() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGameHistory = async () => {
      try {
        setLoading(true)

        // Mock data for demonstration
        const mockHistory: GameHistory[] = [
          { id: "1", date: "2023-05-15", score: 3200, wordsFound: 12 },
          { id: "2", date: "2023-05-14", score: 2800, wordsFound: 10 },
          { id: "3", date: "2023-05-12", score: 4500, wordsFound: 15 },
          { id: "4", date: "2023-05-10", score: 1900, wordsFound: 8 },
          { id: "5", date: "2023-05-08", score: 3700, wordsFound: 14 },
        ]

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setGameHistory(mockHistory)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load game history",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchGameHistory()
  }, [toast])

  const handleLogout = () => {
    logout()
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen casino-table flex items-center justify-center p-2 sm:p-4 pt-16 sm:pt-20">
          <div className="w-full max-w-md mx-auto game-card border-0 sm:border-4 border-amber-600 rounded-none sm:rounded-xl shadow-none sm:shadow-2xl p-3 sm:p-6 text-center">
            <User className="h-12 w-12 sm:h-16 sm:w-16 text-amber-300 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-amber-100">Profile</h1>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base text-amber-200">Please log in to view your profile</p>
            <Link href="/">
              <Button className="wood-button text-amber-900 font-semibold py-2 sm:py-3 text-sm sm:text-base">Back to Home</Button>
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen casino-table pt-16 sm:pt-20">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className="flex items-center justify-center mb-4 sm:mb-8">
            <User className="h-6 w-6 sm:h-8 sm:w-8 text-amber-300 mr-2" />
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-100">Your Profile</h1>
          </div>

          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <motion.div
                className="game-card border-0 sm:border-4 border-amber-600 rounded-none sm:rounded-xl shadow-none sm:shadow-2xl p-3 sm:p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-amber-100 flex items-center">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-amber-300" />
                  Account Info
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center p-2 felt-pattern rounded border border-amber-600">
                    <span className="text-sm sm:text-base text-amber-200">Username:</span>
                    <span className="font-medium text-sm sm:text-base text-amber-100">{user.username}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 felt-pattern rounded border border-amber-600">
                    <span className="text-sm sm:text-base text-amber-200">Email:</span>
                    <span className="font-medium text-sm sm:text-base text-amber-100">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 felt-pattern rounded border border-amber-600">
                    <span className="text-sm sm:text-base text-amber-200 flex items-center">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Member Since:
                    </span>
                    <span className="font-medium text-sm sm:text-base text-amber-100">May 2023</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="game-card border-4 border-amber-600 rounded-xl shadow-2xl p-3 sm:p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-amber-100 flex items-center">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-amber-300" />
                  Game Statistics
                </h2>

                {loading ? (
                  <div className="flex justify-center py-6 sm:py-8">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-amber-300" />
                    <span className="ml-2 text-sm sm:text-base text-amber-200">Loading stats...</span>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="felt-pattern p-2 sm:p-3 rounded-md border border-amber-600 text-center">
                        <p className="text-amber-200 text-xs sm:text-sm">Games Played</p>
                        <p className="text-xl sm:text-2xl font-bold text-amber-100">{gameHistory.length}</p>
                      </div>
                      <div className="felt-pattern p-2 sm:p-3 rounded-md border border-amber-600 text-center">
                        <p className="text-amber-200 text-xs sm:text-sm">Best Score</p>
                        <p className="text-xl sm:text-2xl font-bold text-amber-100">
                          {gameHistory.length > 0 ? Math.max(...gameHistory.map((g) => g.score)).toLocaleString() : 0}
                        </p>
                      </div>
                      <div className="felt-pattern p-2 sm:p-3 rounded-md border border-amber-600 text-center">
                        <p className="text-amber-200 text-xs sm:text-sm">Total Words</p>
                        <p className="text-xl sm:text-2xl font-bold text-amber-100">
                          {gameHistory.reduce((sum, game) => sum + game.wordsFound, 0)}
                        </p>
                      </div>
                      <div className="felt-pattern p-2 sm:p-3 rounded-md border border-amber-600 text-center">
                        <p className="text-amber-200 text-xs sm:text-sm">Avg Score</p>
                        <p className="text-xl sm:text-2xl font-bold text-amber-100">
                          {gameHistory.length > 0
                            ? Math.round(
                                gameHistory.reduce((sum, game) => sum + game.score, 0) / gameHistory.length,
                              ).toLocaleString()
                            : 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            <motion.div
              className="game-card border-0 sm:border-4 border-amber-600 rounded-none sm:rounded-xl shadow-none sm:shadow-2xl p-3 sm:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-semibold mb-2 sm:mb-3 text-amber-100">Recent Games</h3>
              {loading ? (
                <div className="flex justify-center py-3 sm:py-4">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-amber-300" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 max-h-48 sm:max-h-60 overflow-y-auto">
                  {gameHistory.map((game) => (
                    <div
                      key={game.id}
                      className="felt-pattern p-2 sm:p-3 rounded-md border border-amber-600"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-medium text-sm sm:text-base text-amber-100">{new Date(game.date).toLocaleDateString()}</p>
                        <p className="text-base sm:text-lg font-bold text-amber-100">{game.score.toLocaleString()}</p>
                      </div>
                      <p className="text-xs sm:text-sm text-amber-300">{game.wordsFound} words found</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link href="/play" className="flex-1">
                <Button className="w-full wood-button text-amber-900 font-semibold py-2 sm:py-3 text-sm sm:text-base">Play Game</Button>
              </Link>

              <Link href="/" className="flex-1">
                <Button className="w-full wood-button text-amber-900 font-semibold py-2 sm:py-3 text-sm sm:text-base">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>

              <Button
                className="border-2 border-red-600 bg-red-900/20 text-red-300 hover:bg-red-600 hover:text-white font-semibold py-2 sm:py-3 text-sm sm:text-base"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
