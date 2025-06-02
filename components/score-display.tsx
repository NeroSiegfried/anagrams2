"use client"

import { motion } from "framer-motion"

interface ScoreDisplayProps {
  score: number
  username: string
}

export function ScoreDisplay({ score, username }: ScoreDisplayProps) {
  return (
    <div className="bg-amber-50 rounded-lg p-4 shadow-md w-full">
      <h2 className="text-xl font-bold mb-2 text-amber-800">Score</h2>
      <div className="flex items-center justify-between">
        <span className="text-amber-700">{username}</span>
        <motion.span
          className="text-3xl font-bold text-amber-900"
          key={score}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {score}
        </motion.span>
      </div>
    </div>
  )
}
