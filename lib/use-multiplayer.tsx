"use client"

import { useGame } from "@/lib/game-context"
import { useToast } from "@/components/ui/use-toast"

// Placeholder for multiplayer logic (no realtime, no Supabase)
export function useMultiplayer(gameId?: string, isMultiplayer = false) {
  // No-op multiplayer hooks for now
  return {
    opponents: [],
    sendWordToServer: () => {},
    opponentScores: {},
  }
}
