"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Users, UserPlus, GamepadIcon } from "lucide-react"
import { Navbar } from "@/components/navbar"

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
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 pt-16 sm:pt-20 casino-table">
        <div className="w-full max-w-md mx-auto game-card border-4 border-amber-600 rounded-xl shadow-2xl p-3 sm:p-6">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-amber-300 mr-2" />
            <h1 className="text-2xl sm:text-3xl font-bold text-amber-100">Multiplayer</h1>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <motion.div
              className="score-card rounded-lg p-3 sm:p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-amber-100 flex items-center">
                <GamepadIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-amber-300" />
                Find Random Match
              </h2>

              {!user && (
                <div className="mb-3 sm:mb-4">
                  <Label htmlFor="random-username" className="text-sm sm:text-base text-amber-200">
                    Temporary Username
                  </Label>
                  <Input
                    id="random-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter a username for this match"
                    className="mt-1 sm:mt-2 bg-amber-900/20 border-amber-600 text-amber-100 placeholder:text-amber-400 focus:border-amber-400 text-sm sm:text-base"
                    disabled={isFindingMatch}
                  />
                </div>
              )}

              <Button
                className="w-full wood-button text-amber-900 font-semibold py-2 sm:py-3 text-sm sm:text-base"
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
              className="score-card rounded-lg p-3 sm:p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-amber-100">Create Private Game</h2>
              <Button
                className="w-full wood-button text-amber-900 font-semibold py-2 sm:py-3 text-sm sm:text-base"
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
              className="score-card rounded-lg p-3 sm:p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-amber-100">Join Private Game</h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="game-id" className="text-sm sm:text-base text-amber-200">
                    Game ID
                  </Label>
                  <Input
                    id="game-id"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value.toUpperCase())}
                    placeholder="Enter game ID"
                    className="mt-1 sm:mt-2 bg-amber-900/20 border-amber-600 text-amber-100 placeholder:text-amber-400 focus:border-amber-400 text-sm sm:text-base"
                    disabled={isJoiningGame}
                  />
                </div>

                {!user && (
                  <div>
                    <Label htmlFor="join-username" className="text-sm sm:text-base text-amber-200">
                      Temporary Username
                    </Label>
                    <Input
                      id="join-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter a username for this match"
                      className="mt-1 sm:mt-2 bg-amber-900/20 border-amber-600 text-amber-100 placeholder:text-amber-400 focus:border-amber-400 text-sm sm:text-base"
                      disabled={isJoiningGame}
                    />
                  </div>
                )}

                <Button
                  className="w-full wood-button text-amber-900 font-semibold py-2 sm:py-3 text-sm sm:text-base"
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
    </>
  )
}
