"use client"

import { motion } from "framer-motion"
import { Trophy } from "lucide-react"

interface ScoreDisplayProps {
  score: number
  username: string
}

export function ScoreDisplay({ score, username }: ScoreDisplayProps) {
  return (
    <div className="score-card rounded-lg p-4 shadow-lg w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-amber-100 flex items-center">
          <Trophy className="mr-2 text-amber-300" />
          Score
        </h2>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-amber-300 font-medium">{username}</span>
        <motion.span
          className="text-3xl font-bold text-amber-100"
          key={score}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {score.toLocaleString()}
        </motion.span>
      </div>
    </div>
  )
}
