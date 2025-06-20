"use client"

import { useState, useEffect, useRef } from "react"
import { useGame } from "@/lib/game-context"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

interface Opponent {
  id: string
  username: string
  score: number
  foundWords: string[]
}

interface GameState {
  id: string
  status: string
  base_word: string
  time_limit: number
  current_round: number
  players: Opponent[]
}

export function useMultiplayer(gameId?: string, isMultiplayer = false) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { gameState, addFoundWord, addToScore } = useGame()
  
  const [opponents, setOpponents] = useState<Opponent[]>([])
  const [opponentScores, setOpponentScores] = useState<Record<string, number>>({})
  const [gameStatus, setGameStatus] = useState<string>('waiting')
  const [lastSync, setLastSync] = useState<number>(0)
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastFoundWordsRef = useRef<string[]>([])

  // Poll for game updates
  useEffect(() => {
    if (!isMultiplayer || !gameId) return

    const pollGameState = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}/lobby`)
        const data = await response.json()
        
        if (data.game) {
          const game = data.game
          setGameStatus(game.status)
          
          // Update opponents
          const currentOpponents = game.game_players
            .filter((player: any) => player.user_id !== user?.id)
            .map((player: any) => ({
              id: player.user_id,
              username: player.username,
              score: player.score || 0,
              foundWords: player.found_words || []
            }))
          
          setOpponents(currentOpponents)
          
          // Update opponent scores
          const scores: Record<string, number> = {}
          currentOpponents.forEach((opponent: Opponent) => {
            scores[opponent.id] = opponent.score
          })
          setOpponentScores(scores)
          
          setLastSync(Date.now())
        }
      } catch (error) {
        console.error('Error polling game state:', error)
      }
    }

    // Initial poll
    pollGameState()
    
    // Only set up polling if game is active
    if (gameStatus === 'active' || gameStatus === 'waiting') {
      // Set up polling interval (every 2 seconds)
      pollingIntervalRef.current = setInterval(pollGameState, 2000)
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [isMultiplayer, gameId, user?.id, gameStatus])

  // Send word to server
  const sendWordToServer = async (word: string, score: number) => {
    if (!isMultiplayer || !gameId || !user?.id) return

    try {
      const response = await fetch(`/api/games/${gameId}/submit-word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          word,
          score,
        }),
      })

      if (!response.ok) {
        console.error('Failed to submit word to server')
      }
    } catch (error) {
      console.error('Error submitting word to server:', error)
    }
  }

  // Check for new found words from opponents
  useEffect(() => {
    if (!isMultiplayer || opponents.length === 0) return

    opponents.forEach((opponent) => {
      opponent.foundWords.forEach((word) => {
        if (!lastFoundWordsRef.current.includes(word) && !gameState.foundWords.includes(word)) {
          // Show notification for opponent's word
          toast({
            title: `${opponent.username} found a word!`,
            description: word,
            variant: "default",
          })
        }
      })
    })

    // Update last found words
    lastFoundWordsRef.current = opponents.flatMap(opp => opp.foundWords)
  }, [opponents, gameState.foundWords, isMultiplayer, toast])

  return {
    opponents,
    sendWordToServer,
    opponentScores,
    gameStatus,
    lastSync,
  }
}
