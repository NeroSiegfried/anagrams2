"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shuffle, Volume2, VolumeX, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useGame } from "@/lib/game-context"
import { useAuth } from "@/lib/auth-context"
import { FoundWordsList } from "@/components/found-words-list"
import { ScoreDisplay } from "@/components/score-display"
import { GameOverModal } from "@/components/game-over-modal"
import { DefinitionModal } from "@/components/definition-modal"
import { useMultiplayer } from "@/lib/use-multiplayer"

export function GameBoard({
  gameId,
  multiplayer = false,
}: {
  gameId?: string
  multiplayer?: boolean
}) {
  const { toast } = useToast()
  const { user } = useAuth()
  const {
    gameSettings,
    startGame,
    endGame,
    validateWord,
    calculateScore,
    scrambleWord,
    isGameActive,
    currentRound,
    score,
  } = useGame()

  const [letters, setLetters] = useState<string[]>([])
  const [currentWord, setCurrentWord] = useState<string[]>([])
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(gameSettings.roundDuration)
  const [isMuted, setIsMuted] = useState(false)
  const [showGameOver, setShowGameOver] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [showDefinition, setShowDefinition] = useState(false)
  const [feedbackState, setFeedbackState] = useState<"idle" | "correct" | "incorrect" | "bonus">("idle")

  const correctAudioRef = useRef<HTMLAudioElement | null>(null)
  const incorrectAudioRef = useRef<HTMLAudioElement | null>(null)
  const bonusAudioRef = useRef<HTMLAudioElement | null>(null)
  const bgMusicRef = useRef<HTMLAudioElement | null>(null)

  const { opponents, sendWordToServer, opponentScores } = useMultiplayer(gameId, multiplayer)

  // Initialize audio elements
  useEffect(() => {
    correctAudioRef.current = new Audio("/sounds/correct.mp3")
    incorrectAudioRef.current = new Audio("/sounds/incorrect.mp3")
    bonusAudioRef.current = new Audio("/sounds/bonus.mp3")
    bgMusicRef.current = new Audio("/sounds/background-music.mp3")

    if (bgMusicRef.current) {
      bgMusicRef.current.loop = true
      bgMusicRef.current.volume = 0.3

      if (!isMuted) {
        bgMusicRef.current.play().catch((e) => console.log("Audio autoplay prevented:", e))
      }
    }

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause()
      }
    }
  }, [])

  // Update audio mute state
  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.muted = isMuted
    }
    if (correctAudioRef.current) {
      correctAudioRef.current.muted = isMuted
    }
    if (incorrectAudioRef.current) {
      incorrectAudioRef.current.muted = isMuted
    }
    if (bonusAudioRef.current) {
      bonusAudioRef.current.muted = isMuted
    }
  }, [isMuted])

  // Start game and initialize letters
  useEffect(() => {
    if (!isGameActive) {
      startGame()
      const scrambled = scrambleWord(gameSettings.letterCount)
      setLetters(scrambled.split(""))
      setTimeLeft(gameSettings.roundDuration)
      setFoundWords([])
      setCurrentWord([])
      setSelectedIndices([])
    }
  }, [isGameActive, startGame, scrambleWord, gameSettings])

  // Timer countdown
  useEffect(() => {
    if (!isGameActive || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setShowGameOver(true)
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isGameActive, timeLeft, endGame])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGameActive) return

      // Letter keys
      if (/^[a-zA-Z]$/.test(e.key)) {
        const letterIndex = letters.findIndex(
          (l, i) => l.toLowerCase() === e.key.toLowerCase() && !selectedIndices.includes(i),
        )
        if (letterIndex !== -1) {
          addLetterToWord(letterIndex)
        }
      }

      // Backspace
      else if (e.key === "Backspace") {
        removeLastLetter()
      }

      // Delete/Escape
      else if (e.key === "Delete" || e.key === "Escape") {
        clearCurrentWord()
      }

      // Enter
      else if (e.key === "Enter") {
        submitWord()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isGameActive, letters, selectedIndices, currentWord])

  const addLetterToWord = (index: number) => {
    if (selectedIndices.includes(index)) return

    setCurrentWord((prev) => [...prev, letters[index]])
    setSelectedIndices((prev) => [...prev, index])
  }

  const removeLastLetter = () => {
    if (currentWord.length === 0) return

    setCurrentWord((prev) => prev.slice(0, -1))
    setSelectedIndices((prev) => prev.slice(0, -1))
  }

  const clearCurrentWord = () => {
    setCurrentWord([])
    setSelectedIndices([])
  }

  const shuffleLetters = () => {
    const newLetters = [...letters]
    for (let i = newLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newLetters[i], newLetters[j]] = [newLetters[j], newLetters[i]]
    }
    setLetters(newLetters)
    clearCurrentWord()
  }

  const submitWord = async () => {
    const word = currentWord.join("").toLowerCase()

    if (word.length < 3) {
      toast({
        title: "Word too short",
        description: "Words must be at least 3 letters long",
        variant: "destructive",
      })
      setFeedbackState("incorrect")
      if (incorrectAudioRef.current && !isMuted) {
        incorrectAudioRef.current.play()
      }
      setTimeout(() => setFeedbackState("idle"), 500)
      return
    }

    if (foundWords.includes(word)) {
      toast({
        title: "Already found",
        description: "You've already found this word",
        variant: "destructive",
      })
      setFeedbackState("incorrect")
      if (incorrectAudioRef.current && !isMuted) {
        incorrectAudioRef.current.play()
      }
      setTimeout(() => setFeedbackState("idle"), 500)
      return
    }

    const isValid = await validateWord(word)

    if (isValid) {
      const wordScore = calculateScore(word.length)

      // Multiplayer: send word to server
      if (multiplayer) {
        sendWordToServer(word, wordScore)
      }

      setFoundWords((prev) => [...prev, word])

      // Play sound and show feedback
      if (word.length >= 6) {
        setFeedbackState("bonus")
        if (bonusAudioRef.current && !isMuted) {
          bonusAudioRef.current.play()
        }
      } else {
        setFeedbackState("correct")
        if (correctAudioRef.current && !isMuted) {
          correctAudioRef.current.play()
        }
      }

      toast({
        title: "Word found!",
        description: `+${wordScore} points`,
        variant: "default",
      })
    } else {
      setFeedbackState("incorrect")
      if (incorrectAudioRef.current && !isMuted) {
        incorrectAudioRef.current.play()
      }

      toast({
        title: "Invalid word",
        description: "Not in our dictionary",
        variant: "destructive",
      })
    }

    setTimeout(() => setFeedbackState("idle"), 500)
    clearCurrentWord()
  }

  const handleWordClick = (word: string) => {
    setSelectedWord(word)
    setShowDefinition(true)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 game-board">
      <div className="w-full max-w-4xl mx-auto bg-white/90 rounded-xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Clock className="mr-2 text-amber-700" />
            <span className="text-2xl font-bold text-amber-800">{formatTime(timeLeft)}</span>
          </div>

          <h1 className="text-3xl font-bold text-center text-amber-900">Round {currentRound}</h1>

          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="text-amber-700">
            {isMuted ? <VolumeX /> : <Volume2 />}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col items-center">
            <ScoreDisplay score={score} username={user?.username || "Guest"} />

            {multiplayer && (
              <div className="mt-4 w-full">
                <h3 className="text-lg font-semibold mb-2 text-amber-800">Opponents</h3>
                <div className="space-y-2">
                  {opponents.map((opponent, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-amber-50 rounded">
                      <span>{opponent}</span>
                      <span className="font-bold">{opponentScores[opponent] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <FoundWordsList words={foundWords} onWordClick={handleWordClick} />
        </div>

        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex space-x-2">
              {Array.from({ length: gameSettings.letterCount }).map((_, i) => (
                <div
                  key={i}
                  className={`letter-slot ${
                    i < currentWord.length ? `filled ${feedbackState !== "idle" ? feedbackState : ""}` : ""
                  }`}
                >
                  {i < currentWord.length && currentWord[i]}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center items-center space-x-4">
            <Button variant="outline" onClick={clearCurrentWord} className="border-amber-600 text-amber-800">
              Clear
            </Button>

            <Button onClick={submitWord} className="bg-amber-600 hover:bg-amber-700" disabled={currentWord.length < 3}>
              Submit
            </Button>

            <Button variant="outline" size="icon" onClick={shuffleLetters} className="border-amber-600 text-amber-800">
              <Shuffle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <div className="flex flex-wrap justify-center gap-2">
            {letters.map((letter, i) => (
              <motion.div
                key={i}
                className={`letter-tile ${selectedIndices.includes(i) ? "opacity-50" : ""}`}
                whileHover={{ scale: selectedIndices.includes(i) ? 1 : 1.05 }}
                whileTap={{ scale: selectedIndices.includes(i) ? 1 : 0.95 }}
                onClick={() => !selectedIndices.includes(i) && addLetterToWord(i)}
              >
                {letter}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showGameOver && (
          <GameOverModal
            score={score}
            foundWords={foundWords}
            onClose={() => setShowGameOver(false)}
            onPlayAgain={() => {
              setShowGameOver(false)
              startGame()
              const scrambled = scrambleWord(gameSettings.letterCount)
              setLetters(scrambled.split(""))
              setTimeLeft(gameSettings.roundDuration)
              setFoundWords([])
              setCurrentWord([])
              setSelectedIndices([])
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDefinition && selectedWord && (
          <DefinitionModal word={selectedWord} onClose={() => setShowDefinition(false)} />
        )}
      </AnimatePresence>

      {/* Hidden audio elements */}
      <audio ref={correctAudioRef} src="/sounds/correct.mp3" preload="auto" />
      <audio ref={incorrectAudioRef} src="/sounds/incorrect.mp3" preload="auto" />
      <audio ref={bonusAudioRef} src="/sounds/bonus.mp3" preload="auto" />
      <audio ref={bgMusicRef} src="/sounds/background-music.mp3" preload="auto" loop />
    </div>
  )
}
