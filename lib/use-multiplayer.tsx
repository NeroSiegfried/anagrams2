"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useGame } from "@/lib/game-context"
import { useToast } from "@/components/ui/use-toast"

export function useMultiplayer(gameId?: string, isMultiplayer = false) {
  const { user } = useAuth()
  const { addToScore } = useGame()
  const { toast } = useToast()

  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [opponents, setOpponents] = useState<string[]>([])
  const [opponentScores, setOpponentScores] = useState<Record<string, number>>({})
  const [isConnected, setIsConnected] = useState(false)

  // Connect to WebSocket server when component mounts
  useEffect(() => {
    if (!isMultiplayer || !gameId) return

    // In a real implementation, this would connect to a real WebSocket server
    // For demo purposes, we'll simulate WebSocket behavior

    console.log(`Connecting to game: ${gameId}`)

    // Simulate connection
    const mockSocket = {
      send: (data: string) => {
        console.log("Sending data:", data)
        // Simulate receiving data from server
        const parsedData = JSON.parse(data)

        if (parsedData.type === "join") {
          // Simulate other players joining
          setTimeout(() => {
            const mockOpponents = ["Player1", "Player2"]
            setOpponents(mockOpponents)

            toast({
              title: "Players joined",
              description: `${mockOpponents.join(", ")} joined the game`,
            })
          }, 1500)
        }

        if (parsedData.type === "word_found") {
          // Simulate opponent finding a word
          setTimeout(() => {
            const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)]
            if (randomOpponent) {
              const randomScore = Math.floor(Math.random() * 500) + 100

              setOpponentScores((prev) => ({
                ...prev,
                [randomOpponent]: (prev[randomOpponent] || 0) + randomScore,
              }))

              toast({
                title: `${randomOpponent} found a word!`,
                description: `+${randomScore} points`,
              })
            }
          }, 5000)
        }
      },
      close: () => {
        console.log("Closing connection")
        setIsConnected(false)
      },
    } as unknown as WebSocket

    setSocket(mockSocket as unknown as WebSocket)
    setIsConnected(true)

    // Simulate joining the game
    setTimeout(() => {
      mockSocket.send(
        JSON.stringify({
          type: "join",
          gameId,
          username: user?.username || "Guest",
        }),
      )
    }, 500)

    return () => {
      mockSocket.close()
    }
  }, [gameId, isMultiplayer, user, toast, opponents])

  // Send a found word to the server
  const sendWordToServer = useCallback(
    (word: string, score: number) => {
      if (!socket || !isConnected) return

      socket.send(
        JSON.stringify({
          type: "word_found",
          gameId,
          username: user?.username || "Guest",
          word,
          score,
        }),
      )

      // Add score to local state
      addToScore(score)
    },
    [socket, isConnected, gameId, user, addToScore],
  )

  return {
    opponents,
    opponentScores,
    sendWordToServer,
    isConnected,
  }
}
