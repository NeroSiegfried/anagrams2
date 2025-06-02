"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

interface GameOverModalProps {
  score: number
  foundWords: string[]
  onClose: () => void
  onPlayAgain: () => void
}

export function GameOverModal({ score, foundWords, onClose, onPlayAgain }: GameOverModalProps) {
  const { user } = useAuth()

  const getScoreForWord = (word: string) => {
    const length = word.length
    if (length === 3) return 100
    if (length === 4) return 300
    if (length === 5) return 1200
    return 2000 // 6+ letters
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-amber-900">Game Over!</h2>

        <div className="mb-6">
          <div className="bg-amber-50 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-2 text-amber-800">Final Score</h3>
            <p className="text-3xl font-bold text-amber-900">{score}</p>
          </div>

          <div className="bg-amber-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2 text-amber-800">Words Found ({foundWords.length})</h3>
            {foundWords.length > 0 ? (
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {foundWords.map((word) => (
                    <div key={word} className="flex justify-between items-center p-2 bg-white rounded-md">
                      <span className="text-amber-900">{word}</span>
                      <span className="font-bold text-amber-700">+{getScoreForWord(word)}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-amber-700 italic">No words found</p>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <Button onClick={onPlayAgain} className="bg-amber-600 hover:bg-amber-700">
            Play Again
          </Button>

          <div className="flex space-x-2">
            <Button variant="outline" className="flex-1 border-amber-600 text-amber-800" onClick={onClose}>
              Back to Menu
            </Button>

            {!user && (
              <Link href="/signup" className="flex-1">
                <Button variant="outline" className="w-full border-amber-600 text-amber-800">
                  Sign Up to Save Score
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
