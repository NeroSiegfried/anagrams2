"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useParams, useRouter } from "next/navigation"
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
  const router = useRouter()
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
        // Use the optimized API call that returns words without definitions
        const response = await fetch(`/api/possible-words?letters=${baseWord}&withoutDefinitions=true`)

        if (!response.ok) {
          throw new Error("Failed to fetch possible words")
        }

        const data = await response.json()
        const words = data.words || []
        
        // Sort by points (descending) then alphabetically
        const sortedWords = words.sort((a: Word, b: Word) => {
          const scoreA = calculateScore(a.length)
          const scoreB = calculateScore(b.length)
          
          // First sort by score (descending)
          if (scoreA !== scoreB) {
            return scoreB - scoreA
          }
          
          // Then sort alphabetically
          return a.word.localeCompare(b.word)
        })
        
        setPossibleWords(sortedWords)
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

    // Sort by points (descending) then alphabetically
    const sortedWords = words.sort((a: Word, b: Word) => {
      const scoreA = calculateScore(a.length)
      const scoreB = calculateScore(b.length)
      
      // First sort by score (descending)
      if (scoreA !== scoreB) {
        return scoreB - scoreA
      }
      
      // Then sort alphabetically
      return a.word.localeCompare(b.word)
    })

    setPossibleWords([...new Set(sortedWords)])
  }

  const handleWordClick = (word: string) => {
    setSelectedWord(word)
    setShowDefinition(true)
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 pt-16 sm:pt-20 casino-table">
        <div className="w-full max-w-2xl mx-auto game-card border-4 border-amber-600 rounded-xl shadow-2xl p-3 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <Button onClick={() => { localStorage.setItem('anagramsReturnToGame', '1'); router.push('/play'); }} variant="ghost" className="text-amber-300 hover:text-amber-100 hover:bg-green-800 text-sm sm:text-base">
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              Back to Game
            </Button>
            <div className="flex items-center">
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-amber-300 mr-1 sm:mr-2" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-100">All Possible Words</h1>
            </div>
            <div className="w-16 sm:w-24" /> {/* Spacer for centering */}
          </div>

          {baseWord && (
            <div className="score-card rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-amber-100 text-center mb-1 sm:mb-2">Base Word</h2>
              <p className="text-2xl sm:text-3xl font-bold text-amber-100 text-center uppercase tracking-wider">{baseWord}</p>
            </div>
          )}

          <div className="score-card rounded-lg p-3 sm:p-4">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-amber-100 flex items-center">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-amber-300" />
              All Possible Words
              <span className="text-xs sm:text-sm ml-1 sm:ml-2 text-amber-400">(Click for definition)</span>
            </h3>

            {loading ? (
              <div className="flex justify-center items-center py-6 sm:py-8">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-amber-300 mr-1 sm:mr-2" />
                <span className="text-sm sm:text-base text-amber-200">Loading words...</span>
              </div>
            ) : (
              <ScrollArea className="h-[300px] sm:h-[400px]">
                <div className="space-y-2 sm:space-y-3 pr-2 sm:pr-4">
                  {possibleWords.map((wordObj) => (
                    <motion.div
                      key={wordObj.word}
                      className="flex justify-between items-center p-2 sm:p-3 felt-pattern rounded-md border border-amber-600 cursor-pointer hover:bg-amber-900/30"
                      onClick={() => handleWordClick(wordObj.word)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center">
                        <span className="text-amber-100 font-medium text-base sm:text-lg">{wordObj.word.toUpperCase()}</span>
                        <Info className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 text-amber-300 opacity-70" />
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <span className="text-amber-400 text-xs sm:text-sm">{wordObj.length} letters</span>
                        <span className="font-bold text-amber-300 bg-amber-900/30 px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm">
                          +{calculateScore(wordObj.length)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {!loading && possibleWords.length === 0 && (
              <p className="text-sm sm:text-base text-amber-300 italic text-center py-6 sm:py-8">No words found for this combination.</p>
            )}
          </div>

          <div className="mt-4 sm:mt-6 text-center">
            <Link href="/play">
              <Button className="wood-button text-amber-900 font-semibold py-2 sm:py-3 px-4 sm:px-6 text-sm sm:text-base">Play Another Round</Button>
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
