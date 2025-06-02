"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FoundWordsListProps {
  words: string[]
  onWordClick: (word: string) => void
}

export function FoundWordsList({ words, onWordClick }: FoundWordsListProps) {
  const getScoreForWord = (word: string) => {
    const length = word.length
    if (length === 3) return 100
    if (length === 4) return 300
    if (length === 5) return 1200
    return 2000 // 6+ letters
  }

  const wordVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -20 },
  }

  return (
    <div className="bg-amber-50 rounded-lg p-4 shadow-md">
      <h2 className="text-xl font-bold mb-2 text-amber-800">Found Words</h2>
      {words.length === 0 ? (
        <p className="text-amber-700 italic">No words found yet...</p>
      ) : (
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-2">
            {words.map((word, index) => (
              <motion.div
                key={word}
                className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm"
                variants={wordVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 * index }}
              >
                <Button
                  variant="ghost"
                  className="p-0 h-auto text-amber-900 hover:text-amber-700 hover:bg-transparent"
                  onClick={() => onWordClick(word)}
                >
                  {word}
                </Button>
                <span className="font-bold text-amber-700">+{getScoreForWord(word)}</span>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
