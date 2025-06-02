"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Loader2 } from "lucide-react"

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
    // In a real implementation, this would fetch the user's game history from the server
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
      <div className="min-h-screen flex items-center justify-center p-4 game-board">
        <div className="w-full max-w-md mx-auto bg-white/90 rounded-xl shadow-xl p-6 text-center">
          <h1 className="text-3xl font-bold mb-6 text-amber-900">Profile</h1>
          <p className="mb-6 text-amber-800">Please log in to view your profile</p>
          <Link href="/">
            <Button className="bg-amber-600 hover:bg-amber-700">Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 game-board">
      <div className="w-full max-w-md mx-auto bg-white/90 rounded-xl shadow-xl p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-amber-900">Your Profile</h1>

        <div className="space-y-6">
          <motion.div
            className="bg-amber-50 rounded-lg p-4 shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-xl font-bold mb-2 text-amber-800">Account Info</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-amber-700">Username:</span>
                <span className="font-medium">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Member Since:</span>
                <span className="font-medium">May 2023</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-amber-50 rounded-lg p-4 shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-bold mb-4 text-amber-800">Game Statistics</h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-md shadow-sm text-center">
                    <p className="text-amber-700 text-sm">Games Played</p>
                    <p className="text-2xl font-bold text-amber-900">{gameHistory.length}</p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm text-center">
                    <p className="text-amber-700 text-sm">Best Score</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {gameHistory.length > 0 ? Math.max(...gameHistory.map((g) => g.score)) : 0}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm text-center">
                    <p className="text-amber-700 text-sm">Total Words</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {gameHistory.reduce((sum, game) => sum + game.wordsFound, 0)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm text-center">
                    <p className="text-amber-700 text-sm">Avg Score</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {gameHistory.length > 0
                        ? Math.round(gameHistory.reduce((sum, game) => sum + game.score, 0) / gameHistory.length)
                        : 0}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-amber-800">Recent Games</h3>
                  <div className="space-y-2">
                    {gameHistory.map((game) => (
                      <div key={game.id} className="bg-white p-3 rounded-md shadow-sm flex justify-between">
                        <div>
                          <p className="font-medium">{new Date(game.date).toLocaleDateString()}</p>
                          <p className="text-sm text-amber-700">{game.wordsFound} words found</p>
                        </div>
                        <p className="text-xl font-bold text-amber-900">{game.score}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          <div className="flex flex-col space-y-2">
            <Link href="/play">
              <Button className="w-full bg-amber-600 hover:bg-amber-700">Play Game</Button>
            </Link>

            <Link href="/settings">
              <Button variant="outline" className="w-full border-amber-600 text-amber-800">
                Game Settings
              </Button>
            </Link>

            <Button variant="outline" className="w-full border-amber-600 text-amber-800" onClick={handleLogout}>
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
