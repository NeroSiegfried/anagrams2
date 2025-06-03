"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useGame } from "@/lib/game-context"

interface FoundWordsListProps {
  words: string[]
  onWordClick: (word: string) => void
}

export function FoundWordsList({ words, onWordClick }: FoundWordsListProps) {
  const { calculateScore } = useGame()

  const wordVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <div className="score-card rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-bold mb-3 text-amber-100">Found Words</h2>
      {words.length === 0 ? (
        <p className="text-amber-300 italic">No words found yet...</p>
      ) : (
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-2">
            {words.map((word, index) => (
              <motion.div
                key={word}
                className="flex justify-between items-center p-3 felt-pattern rounded-md shadow-sm border border-amber-600"
                variants={wordVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 * index }}
              >
                <Button
                  variant="ghost"
                  className="p-0 h-auto text-amber-100 hover:text-amber-300 hover:bg-transparent font-semibold"
                  onClick={() => onWordClick(word)}
                >
                  {word.toUpperCase()}
                </Button>
                <span className="font-bold text-amber-300 bg-amber-900/30 px-2 py-1 rounded text-sm">
                  +{calculateScore(word.length)}
                </span>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
