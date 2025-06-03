"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { useGame } from "@/lib/game-context"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

export function useMultiplayer(gameId?: string, isMultiplayer = false) {
  const { user } = useAuth()
  const { addToScore, setBaseWord, setTimeUp } = useGame()
  const { toast } = useToast()
  const supabase = getSupabaseClient()

  const [opponents, setOpponents] = useState<string[]>([])
  const [opponentScores, setOpponentScores] = useState<Record<string, number>>({})
  const [isConnected, setIsConnected] = useState(false)
  const [disconnectedAt, setDisconnectedAt] = useState<number | null>(null)
  const [gameChannel, setGameChannel] = useState<RealtimeChannel | null>(null)

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Connect to Supabase Realtime when component mounts
  useEffect(() => {
    if (!isMultiplayer || !gameId || !supabase) return

    // Create a channel for this specific game
    const channel = supabase.channel(`game:${gameId}`, {
      config: {
        broadcast: {
          self: false,
        },
      },
    })

    // Handle player joined events
    channel.on("broadcast", { event: "player_joined" }, ({ payload }) => {
      toast({
        title: "Player joined",
        description: `${payload.username} joined the game`,
      })

      setOpponents((prev) => [...prev.filter((name) => name !== payload.username), payload.username])
    })

    // Handle player left events
    channel.on("broadcast", { event: "player_left" }, ({ payload }) => {
      toast({
        title: "Player left",
        description: `${payload.username} left the game`,
      })

      setOpponents((prev) => prev.filter((name) => name !== payload.username))
    })

    // Handle word found events
    channel.on("broadcast", { event: "word_found" }, ({ payload }) => {
      setOpponentScores((prev) => ({
        ...prev,
        [payload.username]: (prev[payload.username] || 0) + payload.score,
      }))

      toast({
        title: `${payload.username} found a word!`,
        description: `+${payload.score} points`,
      })
    })

    // Handle game over events
    channel.on("broadcast", { event: "game_over" }, ({ payload }) => {
      // Handle game over, show results
      toast({
        title: "Game Over",
        description: `${payload.winner} won with ${payload.score} points!`,
      })
    })

    // Handle game setup events
    channel.on("broadcast", { event: "game_setup" }, ({ payload }) => {
      if (payload.baseWord) {
        setBaseWord(payload.baseWord)
      }
    })

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true)
        setDisconnectedAt(null)

        // Announce this player has joined
        channel.send({
          type: "broadcast",
          event: "player_joined",
          payload: {
            username: user?.user_metadata?.username || user?.email || "Guest",
            userId: user?.id || null,
          },
        })
      } else if (status === "CHANNEL_ERROR") {
        setIsConnected(false)
        setDisconnectedAt(Date.now())

        // Try to reconnect after a delay
        reconnectTimeoutRef.current = setTimeout(() => {
          // If we've been disconnected for more than 10 seconds, end the game
          if (Date.now() - (disconnectedAt || Date.now()) > 10000) {
            setTimeUp(true)
            toast({
              title: "Connection lost",
              description: "You've been disconnected for too long",
              variant: "destructive",
            })
          }
        }, 10000)
      }
    })

    setGameChannel(channel)

    // Cleanup function
    return () => {
      if (channel) {
        // Announce this player is leaving
        channel.send({
          type: "broadcast",
          event: "player_left",
          payload: {
            username: user?.user_metadata?.username || user?.email || "Guest",
            userId: user?.id || null,
          },
        })

        channel.unsubscribe()
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [gameId, isMultiplayer, user, toast, setBaseWord, setTimeUp, disconnectedAt, supabase])

  // Send a found word to other players
  const sendWordToServer = useCallback(
    (word: string, score: number) => {
      if (!gameChannel || !isConnected) return

      gameChannel.send({
        type: "broadcast",
        event: "word_found",
        payload: {
          username: user?.user_metadata?.username || user?.email || "Guest",
          userId: user?.id || null,
          word,
          score,
        },
      })

      // Add score to local state
      addToScore(score)
    },
    [gameChannel, isConnected, user, addToScore],
  )

  // Submit final results
  const submitResults = useCallback(
    (foundWords: string[], score: number) => {
      if (!gameChannel || !isConnected) return

      gameChannel.send({
        type: "broadcast",
        event: "game_over",
        payload: {
          username: user?.user_metadata?.username || user?.email || "Guest",
          userId: user?.id || null,
          foundWords,
          score,
          winner: user?.user_metadata?.username || user?.email || "Guest",
        },
      })
    },
    [gameChannel, isConnected, user],
  )

  return {
    opponents,
    opponentScores,
    sendWordToServer,
    submitResults,
    isConnected,
    disconnectedAt,
  }
}
