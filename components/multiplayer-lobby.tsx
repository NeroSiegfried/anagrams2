"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Users, UserPlus } from "lucide-react"

export function MultiplayerLobby() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [gameId, setGameId] = useState("")
  const [username, setUsername] = useState("")
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [isJoiningGame, setIsJoiningGame] = useState(false)
  const [isFindingMatch, setIsFindingMatch] = useState(false)

  const handleCreateGame = async () => {
    setIsCreatingGame(true)

    try {
      // In a real implementation, this would create a game on the server
      const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase()

      toast({
        title: "Game created!",
        description: `Your game ID is ${newGameId}`,
      })

      // Navigate to the game
      router.push(`/play/multiplayer/${newGameId}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      })
      setIsCreatingGame(false)
    }
  }

  const handleJoinGame = () => {
    if (!gameId) {
      toast({
        title: "Error",
        description: "Please enter a game ID",
        variant: "destructive",
      })
      return
    }

    setIsJoiningGame(true)

    // In a real implementation, this would validate the game ID on the server
    router.push(`/play/multiplayer/${gameId}`)
  }

  const handleFindMatch = () => {
    if (!user && !username) {
      toast({
        title: "Error",
        description: "Please enter a username for the match",
        variant: "destructive",
      })
      return
    }

    setIsFindingMatch(true)

    // In a real implementation, this would find a match on the server
    setTimeout(() => {
      const randomGameId = Math.random().toString(36).substring(2, 8).toUpperCase()
      router.push(`/play/multiplayer/${randomGameId}`)
    }, 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 game-board">
      <div className="w-full max-w-md mx-auto bg-white/90 rounded-xl shadow-xl p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-amber-900">Multiplayer Lobby</h1>

        <div className="space-y-6">
          <motion.div
            className="bg-amber-50 rounded-lg p-4 shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-bold mb-4 text-amber-800">Find Random Match</h2>

            {!user && (
              <div className="mb-4">
                <Label htmlFor="random-username">Temporary Username</Label>
                <Input
                  id="random-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter a username for this match"
                  className="mb-4"
                  disabled={isFindingMatch}
                />
              </div>
            )}

            <Button
              className="w-full bg-amber-600 hover:bg-amber-700"
              onClick={handleFindMatch}
              disabled={isFindingMatch}
            >
              {isFindingMatch ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finding match...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Find Random Match
                </>
              )}
            </Button>
          </motion.div>

          <motion.div
            className="bg-amber-50 rounded-lg p-4 shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-bold mb-4 text-amber-800">Create Private Game</h2>
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700"
              onClick={handleCreateGame}
              disabled={isCreatingGame}
            >
              {isCreatingGame ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating game...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Game
                </>
              )}
            </Button>
          </motion.div>

          <motion.div
            className="bg-amber-50 rounded-lg p-4 shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-bold mb-4 text-amber-800">Join Private Game</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="game-id">Game ID</Label>
                <Input
                  id="game-id"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value.toUpperCase())}
                  placeholder="Enter game ID"
                  className="mb-4"
                  disabled={isJoiningGame}
                />
              </div>

              {!user && (
                <div>
                  <Label htmlFor="join-username">Temporary Username</Label>
                  <Input
                    id="join-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter a username for this match"
                    className="mb-4"
                    disabled={isJoiningGame}
                  />
                </div>
              )}

              <Button
                className="w-full bg-amber-600 hover:bg-amber-700"
                onClick={handleJoinGame}
                disabled={isJoiningGame}
              >
                {isJoiningGame ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining game...
                  </>
                ) : (
                  "Join Game"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
