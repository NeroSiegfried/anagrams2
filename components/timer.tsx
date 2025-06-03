"use client"

import { Clock } from "lucide-react"

interface TimerProps {
  timeLeft: number
}

export function Timer({ timeLeft }: TimerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center">
      <Clock className="mr-2 text-white" />
      <span className="text-xl font-mono font-bold text-white">{formatTime(timeLeft)}</span>
    </div>
  )
}
