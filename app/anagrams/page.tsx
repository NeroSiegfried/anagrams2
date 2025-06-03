"use client"

import { useSearchParams } from "next/navigation"
import { GameBoard } from "@/components/game-board"

export default function AnagramsPage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode") === "multiplayer" ? "multiplayer" : "single"
  const gameId = searchParams.get("gameId") || undefined

  return <GameBoard mode={mode} gameId={gameId} />
}
