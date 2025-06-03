"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Loader2, User, Trophy, Calendar, Target, Home } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center p-4 casino-table">
        <div className="w-full max-w-md mx-auto game-card border-4 border-amber-600 rounded-xl shadow-2xl p-6 text-center">
          <User className="h-16 w-16 text-amber-300 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-6 text-amber-100">Profile</h1>
          <p className="mb-6 text-amber-200">Please log in to view your profile</p>
          <Link href="/">
            <Button className="wood-button text-amber-900 font-semibold py-3">Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 casino-table">
      <div className="w-full max-w-md mx-auto game-card border-4 border-amber-600 rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-center mb-6">
          <User className="h-8 w-8 text-amber-300 mr-2" />
          <h1 className="text-3xl font-bold text-amber-100">Your Profile</h1>
        </div>

        <div className="space-y-6">
          <motion.div
            className="score-card rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-bold mb-3 text-amber-100 flex items-center">
              <Target className="h-5 w-5 mr-2 text-amber-300" />
              Account Info
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 felt-pattern rounded border border-amber-600">
                <span className="text-amber-200">Username:</span>
                <span className="font-medium text-amber-100">{user.username}</span>
              </div>
              <div className="flex justify-between items-center p-2 felt-pattern rounded border border-amber-600">
                <span className="text-amber-200">Email:</span>
                <span className="font-medium text-amber-100">{user.email}</span>
              </div>
              <div className="flex justify-between items-center p-2 felt-pattern rounded border border-amber-600">
                <span className="text-amber-200 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Member Since:
                </span>
                <span className="font-medium text-amber-100">May 2023</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="score-card rounded-lg p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-bold mb-4 text-amber-100 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-amber-300" />
              Game Statistics
            </h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-amber-300" />
                <span className="ml-2 text-amber-200">Loading stats...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="felt-pattern p-3 rounded-md border border-amber-600 text-center">
                    <p className="text-amber-200 text-sm">Games Played</p>
                    <p className="text-2xl font-bold text-amber-100">{gameHistory.length}</p>
                  </div>
                  <div className="felt-pattern p-3 rounded-md border border-amber-600 text-center">
                    <p className="text-amber-200 text-sm">Best Score</p>
                    <p className="text-2xl font-bold text-amber-100">
                      {gameHistory.length > 0 ? Math.max(...gameHistory.map((g) => g.score)).toLocaleString() : 0}
                    </p>
                  </div>
                  <div className="felt-pattern p-3 rounded-md border border-amber-600 text-center">
                    <p className="text-amber-200 text-sm">Total Words</p>
                    <p className="text-2xl font-bold text-amber-100">
                      {gameHistory.reduce((sum, game) => sum + game.wordsFound, 0)}
                    </p>
                  </div>
                  <div className="felt-pattern p-3 rounded-md border border-amber-600 text-center">
                    <p className="text-amber-200 text-sm">Avg Score</p>
                    <p className="text-2xl font-bold text-amber-100">
                      {gameHistory.length > 0
                        ? Math.round(
                            gameHistory.reduce((sum, game) => sum + game.score, 0) / gameHistory.length,
                          ).toLocaleString()
                        : 0}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-amber-100">Recent Games</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {gameHistory.map((game) => (
                      <div
                        key={game.id}
                        className="felt-pattern p-3 rounded-md border border-amber-600 flex justify-between"
                      >
                        <div>
                          <p className="font-medium text-amber-100">{new Date(game.date).toLocaleDateString()}</p>
                          <p className="text-sm text-amber-300">{game.wordsFound} words found</p>
                        </div>
                        <p className="text-xl font-bold text-amber-100">{game.score.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          <div className="flex flex-col space-y-3">
            <Link href="/play">
              <Button className="w-full wood-button text-amber-900 font-semibold py-3">Play Game</Button>
            </Link>

            <div className="flex space-x-2">
              <Link href="/settings" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-amber-600 text-amber-100 hover:bg-amber-600 hover:text-amber-900"
                >
                  Settings
                </Button>
              </Link>

              <Link href="/" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-amber-600 text-amber-100 hover:bg-amber-600 hover:text-amber-900"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>

            <Button
              variant="outline"
              className="w-full border-red-600 text-red-300 hover:bg-red-600 hover:text-white"
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
