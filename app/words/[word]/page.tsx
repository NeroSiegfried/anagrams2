"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Navbar } from "@/components/navbar"
import { useGame } from "@/lib/game-context"
import { DefinitionModal } from "@/components/definition-modal"
import { Loader2, Search, Info, ArrowLeft, Target } from "lucide-react"
import Link from "next/link"

interface Word {
  word: string
  length: number
  definition?: string
}

export default function WordsPage() {
  const params = useParams()
  const baseWord = params.word as string
  const { calculateScore } = useGame()
  const [possibleWords, setPossibleWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [showDefinition, setShowDefinition] = useState(false)

  useEffect(() => {
    async function fetchPossibleWords() {
      if (!baseWord) return

      try {
        setLoading(true)
        const response = await fetch(`/api/possible-words?letters=${baseWord}`)

        if (!response.ok) {
          throw new Error("Failed to fetch possible words")
        }

        const data = await response.json()
        setPossibleWords(data.words || [])
      } catch (error) {
        console.error("Error fetching possible words:", error)
        // Generate fallback words if API fails
        generateFallbackWords(baseWord)
      } finally {
        setLoading(false)
      }
    }

    fetchPossibleWords()
  }, [baseWord])

  const generateFallbackWords = (base: string) => {
    const words: Word[] = []
    words.push({ word: base, length: base.length })

    // Add some subwords (simplified)
    for (let len = 3; len < base.length; len++) {
      for (let i = 0; i <= base.length - len; i++) {
        const subword = base.substring(i, i + len)
        if (!words.find((w) => w.word === subword)) {
          words.push({ word: subword, length: subword.length })
        }
      }
    }

    setPossibleWords([...new Set(words)].sort((a, b) => b.length - a.length))
  }

  const handleWordClick = (word: string) => {
    setSelectedWord(word)
    setShowDefinition(true)
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center p-4 pt-20 casino-table">
        <div className="w-full max-w-2xl mx-auto game-card border-4 border-amber-600 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/play">
              <Button variant="ghost" className="text-amber-300 hover:text-amber-100 hover:bg-green-800">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Game
              </Button>
            </Link>
            <div className="flex items-center">
              <Target className="h-8 w-8 text-amber-300 mr-2" />
              <h1 className="text-3xl font-bold text-amber-100">All Possible Words</h1>
            </div>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>

          {baseWord && (
            <div className="score-card rounded-lg p-4 mb-6">
              <h2 className="text-xl font-bold text-amber-100 text-center mb-2">Base Word</h2>
              <p className="text-3xl font-bold text-amber-100 text-center uppercase tracking-wider">{baseWord}</p>
            </div>
          )}

          <div className="score-card rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-amber-100 flex items-center">
              <Search className="h-5 w-5 mr-2 text-amber-300" />
              All Possible Words
              <span className="text-sm ml-2 text-amber-400">(Click for definition)</span>
            </h3>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-amber-300 mr-2" />
                <span className="text-amber-200">Loading words...</span>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {possibleWords.map((wordObj) => (
                    <motion.div
                      key={wordObj.word}
                      className="flex justify-between items-center p-3 felt-pattern rounded-md border border-amber-600 cursor-pointer hover:bg-amber-900/30"
                      onClick={() => handleWordClick(wordObj.word)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center">
                        <span className="text-amber-100 font-medium text-lg">{wordObj.word.toUpperCase()}</span>
                        <Info className="h-4 w-4 ml-2 text-amber-300 opacity-70" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-amber-400 text-sm">{wordObj.length} letters</span>
                        <span className="font-bold text-amber-300 bg-amber-900/30 px-2 py-1 rounded text-sm">
                          +{calculateScore(wordObj.length)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {!loading && possibleWords.length === 0 && (
              <p className="text-amber-300 italic text-center py-8">No words found for this combination.</p>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link href="/play">
              <Button className="wood-button text-amber-900 font-semibold py-3 px-6">Play Another Round</Button>
            </Link>
          </div>

          {showDefinition && selectedWord && (
            <DefinitionModal word={selectedWord} onClose={() => setShowDefinition(false)} />
          )}
        </div>
      </div>
    </>
  )
}
