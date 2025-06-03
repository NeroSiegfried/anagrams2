"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shuffle, Volume2, VolumeX, Clock, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useGame } from "@/lib/game-context"
import { useAuth } from "@/lib/auth-context"
import { FoundWordsList } from "@/components/found-words-list"
import { ScoreDisplay } from "@/components/score-display"
import { GameOverModal } from "@/components/game-over-modal"
import { DefinitionModal } from "@/components/definition-modal"
import { SettingsModal } from "@/components/settings-modal"
import { useMultiplayer } from "@/lib/use-multiplayer"
import { Navbar } from "@/components/navbar"
import { AudioGenerator } from "@/lib/audio-generator"

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
    startNewGame,
    endGame,
    validateWord,
    calculateScore,
    gameState,
    setGameState,
    addToScore,
    addFoundWord,
  } = useGame()

  const [currentWord, setCurrentWord] = useState<string[]>([])
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [showGameOver, setShowGameOver] = useState(false)
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [showDefinition, setShowDefinition] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [feedbackState, setFeedbackState] = useState<"idle" | "correct" | "incorrect" | "bonus">("idle")
  const [showSparkles, setShowSparkles] = useState(false)

  const audioGeneratorRef = useRef<AudioGenerator | null>(null)
  const correctSoundRef = useRef<AudioBuffer | null>(null)
  const incorrectSoundRef = useRef<AudioBuffer | null>(null)
  const bonusSoundRef = useRef<AudioBuffer | null>(null)
  const backgroundMusicRef = useRef<AudioBuffer | null>(null)
  const backgroundSourceRef = useRef<AudioBufferSourceNode | null>(null)

  const { opponents, sendWordToServer, opponentScores } = useMultiplayer(gameId, multiplayer)

  // Initialize audio generator and sounds
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        audioGeneratorRef.current = new AudioGenerator()

        // Generate sound buffers
        correctSoundRef.current = audioGeneratorRef.current.generateCorrectSound()
        incorrectSoundRef.current = audioGeneratorRef.current.generateIncorrectSound()
        bonusSoundRef.current = audioGeneratorRef.current.generateBonusSound()
        backgroundMusicRef.current = audioGeneratorRef.current.generateBackgroundMusic()

        // Start background music if enabled
        if (!isMuted && gameSettings.musicEnabled && backgroundMusicRef.current && audioGeneratorRef.current) {
          const playBackgroundMusic = () => {
            if (backgroundSourceRef.current) {
              backgroundSourceRef.current.stop()
            }

            const audioContext = (audioGeneratorRef.current as any).audioContext
            if (audioContext && backgroundMusicRef.current) {
              backgroundSourceRef.current = audioContext.createBufferSource()
              const gainNode = audioContext.createGain()

              backgroundSourceRef.current.buffer = backgroundMusicRef.current
              backgroundSourceRef.current.loop = true
              gainNode.gain.value = 0.1

              backgroundSourceRef.current.connect(gainNode)
              gainNode.connect(audioContext.destination)

              backgroundSourceRef.current.start()
            }
          }

          playBackgroundMusic()
        }
      } catch (error) {
        console.warn("Audio initialization failed:", error)
      }
    }

    return () => {
      if (backgroundSourceRef.current) {
        try {
          backgroundSourceRef.current.stop()
        } catch (error) {
          console.warn("Error stopping background music:", error)
        }
      }
    }
  }, [])

  // Always start a new game when component mounts
  useEffect(() => {
    startNewGame()
    setCurrentWord([])
    setSelectedIndices([])
    setShowGameOver(false)
  }, []) // Empty dependency array to run only on mount

  // Timer countdown
  useEffect(() => {
    if (!gameState.isActive || gameState.timeLeft <= 0) return

    const timer = setInterval(() => {
      setGameState({ timeLeft: gameState.timeLeft - 1 })

      if (gameState.timeLeft <= 1) {
        clearInterval(timer)
        endGame()
        setShowGameOver(true)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState.isActive, gameState.timeLeft, setGameState, endGame])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.isActive || gameState.timeLeft <= 0 || showSettings) return

      // Letter keys
      if (/^[a-zA-Z]$/.test(e.key)) {
        const letterIndex = gameState.letters.findIndex(
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
  }, [gameState.isActive, gameState.timeLeft, gameState.letters, selectedIndices, currentWord, showSettings])

  const playSound = (soundBuffer: AudioBuffer | null) => {
    if (!isMuted && gameSettings.soundEnabled && audioGeneratorRef.current && soundBuffer) {
      audioGeneratorRef.current.playBuffer(soundBuffer, 0.3)
    }
  }

  const addLetterToWord = (index: number) => {
    if (selectedIndices.includes(index) || currentWord.length >= gameState.currentLetterCount) return

    setCurrentWord((prev) => [...prev, gameState.letters[index]])
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
    const newLetters = [...gameState.letters]
    for (let i = newLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newLetters[i], newLetters[j]] = [newLetters[j], newLetters[i]]
    }
    setGameState({ letters: newLetters })
    clearCurrentWord()
  }

  const submitWord = async () => {
    if (gameState.timeLeft <= 0) return

    const word = currentWord.join("").toLowerCase()

    if (word.length < 3) {
      toast({
        title: "Word too short",
        description: "Words must be at least 3 letters long",
        variant: "destructive",
      })
      setFeedbackState("incorrect")
      playSound(incorrectSoundRef.current)
      setTimeout(() => setFeedbackState("idle"), 500)
      return
    }

    if (gameState.foundWords.includes(word)) {
      toast({
        title: "Already found",
        description: "You've already found this word",
        variant: "destructive",
      })
      setFeedbackState("incorrect")
      playSound(incorrectSoundRef.current)
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

      addFoundWord(word)
      addToScore(wordScore)

      // Play sound and show feedback
      if (word.length >= 6) {
        setFeedbackState("bonus")
        setShowSparkles(true)
        playSound(bonusSoundRef.current)
        setTimeout(() => setShowSparkles(false), 1000)
      } else {
        setFeedbackState("correct")
        playSound(correctSoundRef.current)
      }

      toast({
        title: "Word found!",
        description: `+${wordScore} points`,
        variant: "default",
      })
    } else {
      setFeedbackState("incorrect")
      playSound(incorrectSoundRef.current)

      toast({
        title: "Invalid word",
        description: "Not in our dictionary",
        variant: "destructive",
      })
    }

    setTimeout(() => setFeedbackState("idle"), word.length >= 6 ? 1000 : 500)
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
    <>
      <Navbar onSettingsClick={() => setShowSettings(true)} />
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-20 casino-table">
        <div className="w-full max-w-4xl mx-auto game-card rounded-2xl border-4 border-amber-600 shadow-2xl p-4 sm:p-6 relative">
          {showSparkles && (
            <>
              <div className="sparkle" />
              <div className="sparkle" />
              <div className="sparkle" />
              <div className="sparkle" />
            </>
          )}

          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div className="flex items-center">
              <Clock className="mr-2 text-amber-300" />
              <span className="text-xl sm:text-2xl font-bold text-amber-100 font-mono">
                {formatTime(gameState.timeLeft)}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-center text-amber-100">
              Round {gameState.currentRound}
            </h1>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="text-amber-300 hover:text-amber-100 hover:bg-green-800"
              >
                {isMuted ? <VolumeX /> : <Volume2 />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-amber-300 hover:text-amber-100 hover:bg-green-800"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowSettings(true)
                }}
              >
                <Settings />
              </Button>
            </div>
          </div>

          {/* Tiles first (above) on mobile and desktop */}
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {gameState.letters.map((letter, i) => (
                  <motion.div
                    key={i}
                    className={`letter-tile ${selectedIndices.includes(i) ? "opacity-50" : ""}`}
                    whileHover={selectedIndices.includes(i) || gameState.timeLeft <= 0 ? {} : { scale: 1.05 }}
                    whileTap={selectedIndices.includes(i) || gameState.timeLeft <= 0 ? {} : { scale: 0.95 }}
                    onClick={() => !selectedIndices.includes(i) && gameState.timeLeft > 0 && addLetterToWord(i)}
                  >
                    <span className="text-2xl font-bold text-amber-900 z-10 relative">{letter}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Slots below tiles */}
          <div className="mb-6">
            <div className="flex justify-center mb-4 overflow-x-auto pb-2">
              <div className="flex space-x-2 sm:space-x-3">
                {Array.from({ length: gameState.currentLetterCount }).map((_, i) => (
                  <div
                    key={i}
                    className={`letter-slot ${
                      i < currentWord.length ? `filled ${feedbackState !== "idle" ? feedbackState : ""}` : ""
                    }`}
                  >
                    {i < currentWord.length && (
                      <span className="text-2xl font-bold text-amber-100">{currentWord[i]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center items-center space-x-2 sm:space-x-4 mb-6">
              <button
                className="wood-button px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-amber-900"
                onClick={clearCurrentWord}
                disabled={gameState.timeLeft <= 0 || currentWord.length === 0}
              >
                Clear
              </button>

              <button
                className="wood-button px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-amber-900"
                onClick={submitWord}
                disabled={gameState.timeLeft <= 0 || currentWord.length < 3}
              >
                Submit
              </button>

              <button
                className="wood-button px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold text-amber-900"
                onClick={shuffleLetters}
                disabled={gameState.timeLeft <= 0}
              >
                <Shuffle className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex flex-col items-center">
              <ScoreDisplay score={gameState.score} username={user?.username || "Guest"} />

              {multiplayer && (
                <div className="mt-4 w-full score-card rounded-lg p-4 shadow-md">
                  <h3 className="text-lg font-semibold mb-2 text-amber-100">Opponents</h3>
                  <div className="space-y-2">
                    {opponents.map((opponent, i) => (
                      <div key={i} className="flex justify-between items-center p-2 felt-pattern rounded">
                        <span className="text-amber-100">{opponent}</span>
                        <span className="font-bold text-amber-300">{opponentScores[opponent] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <FoundWordsList words={gameState.foundWords} onWordClick={handleWordClick} />
          </div>

          {gameState.timeLeft <= 0 && (
            <motion.div
              className="text-center mt-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <p className="text-2xl font-bold text-red-400 mb-2">Time's Up!</p>
              <p className="text-amber-200">Final Score: {gameState.score}</p>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {showGameOver && (
            <GameOverModal
              score={gameState.score}
              foundWords={gameState.foundWords}
              baseWord={gameState.baseWord}
              onClose={() => setShowGameOver(false)}
              onPlayAgain={() => {
                setShowGameOver(false)
                startNewGame()
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

        <AnimatePresence>{showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}</AnimatePresence>
      </div>
    </>
  )
}
