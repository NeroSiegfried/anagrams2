"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-context"
import { useGame } from "@/lib/game-context"
import Link from "next/link"
import { Trophy, Target, Award, Search, Info } from "lucide-react"
import { DefinitionModal } from "@/components/definition-modal"

interface GameOverModalProps {
  score: number
  foundWords: string[]
  baseWord: string | null
  onClose: () => void
  onPlayAgain: () => void
}

export function GameOverModal({ score, foundWords, baseWord, onClose, onPlayAgain }: GameOverModalProps) {
  const { user } = useAuth() as { user: any }
  const { calculateScore } = useGame()
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [showDefinition, setShowDefinition] = useState(false)
  const hasSubmitted = useRef(false)

  const handleWordClick = (word: string) => {
    setSelectedWord(word)
    setShowDefinition(true)
  }

  // Submit score to the server only once per modal mount
  useEffect(() => {
    if (hasSubmitted.current) return
    hasSubmitted.current = true
    async function submitScore() {
      if (!baseWord) return

      try {
        await fetch("/api/scores", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gameId: "local", // For single player games
            username: user?.username || "Guest",
            score,
            wordsFound: foundWords.length,
            wordsList: foundWords,
            userId: user?.id || null,
          }),
        })
      } catch (error) {
        console.error("Error submitting score:", error)
      }
    }

    submitScore()
  }, [score, foundWords, baseWord, user])

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="game-card border-4 border-amber-600 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header - Fixed */}
        <div className="p-6 flex-shrink-0 border-b border-amber-600">
          <div className="text-center">
            <Trophy className="h-16 w-16 text-amber-300 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-amber-100">Game Over!</h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="h-[400px] p-6">
          <div className="space-y-4">
            <div className="score-card rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-amber-100 flex items-center">
                  <Award className="mr-2 text-amber-300" />
                  Final Score
                </h3>
              </div>
              <p className="text-4xl font-bold text-amber-100 text-center">{score.toLocaleString()}</p>
            </div>

            {baseWord && (
              <div className="score-card rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-amber-100 flex items-center">
                    <Target className="mr-2 text-amber-300" />
                    Base Word
                  </h3>
                </div>
                <p className="text-2xl font-bold text-amber-100 text-center uppercase tracking-wider">{baseWord}</p>
              </div>
            )}

            <div className="score-card rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-amber-100">Words Found ({foundWords.length})</h3>
              {foundWords.length > 0 ? (
                <div className="space-y-2">
                  {foundWords.map((word) => (
                    <div
                      key={word}
                      className="flex justify-between items-center p-2 felt-pattern rounded-md border border-amber-600 cursor-pointer hover:bg-amber-900/30"
                      onClick={() => handleWordClick(word)}
                    >
                      <div className="flex items-center">
                        <span className="text-amber-100 font-medium">{word.toUpperCase()}</span>
                        <Info className="h-4 w-4 ml-2 text-amber-300 opacity-70" />
                      </div>
                      <span className="font-bold text-amber-300 bg-amber-900/30 px-2 py-1 rounded text-sm">
                        +{calculateScore(word.length)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-amber-300 italic text-center">No words found</p>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer - Fixed */}
        <div className="p-6 flex-shrink-0 border-t border-amber-600">
          <div className="flex flex-col space-y-3">
            <Button
              onClick={onPlayAgain}
              className="wood-button text-amber-900 font-semibold py-3 bg-amber-300 hover:bg-amber-400"
            >
              Play Again
            </Button>

            {baseWord && (
              <Link href={`/words/${baseWord}`}>
                <Button
                  variant="outline"
                  className="w-full border-amber-300 bg-amber-900/20 text-amber-100 hover:bg-amber-600 hover:text-amber-900"
                >
                  <Search className="h-4 w-4 mr-2" />
                  View All Possible Words
                </Button>
              </Link>
            )}

            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1 border-amber-300 bg-amber-900/20 text-amber-100 hover:bg-amber-600 hover:text-amber-900"
                onClick={onClose}
              >
                Back to Menu
              </Button>

              {!user && (
                <Link href="/" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-amber-300 bg-amber-900/20 text-amber-100 hover:bg-amber-600 hover:text-amber-900"
                  >
                    Sign Up
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {showDefinition && selectedWord && (
          <DefinitionModal word={selectedWord} onClose={() => setShowDefinition(false)} />
        )}
      </motion.div>
    </motion.div>
  )
}
