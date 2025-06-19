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
import { useRouter } from "next/navigation"

export function GameBoard({
  gameId,
  multiplayer = false,
}: {
  gameId?: string
  multiplayer?: boolean
}) {
  console.log('[GameBoard] Component rendered');
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
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState(false)
  const [restoringGameOver, setRestoringGameOver] = useState(false)
  const hasRestoredRef = useRef(false)
  const hasAutoSubmitted = useRef(false)

  const audioGeneratorRef = useRef<AudioGenerator | null>(null)

  // Track if we've already scrambled for the current base word
  const scrambledForBaseWord = useRef<string | null>(null)

  // Track previous baseWord for logging
  const prevBaseWordRef = useRef<string | null>(null)

  const { opponents, sendWordToServer, opponentScores } = useMultiplayer(gameId, multiplayer)

  const router = useRouter()

  // Add this after currentWord state:
  const currentWordRef = useRef<string[]>([]);
  useEffect(() => { currentWordRef.current = currentWord; }, [currentWord]);

  // Initialize audio generator
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioGeneratorRef.current = new AudioGenerator()
    }
  }, [])

  // Deterministic shuffle using a seed (base word)
  function seededScramble(word: string, seed: number): string[] {
    const arr = word.split("")
    let m = arr.length, t, i
    while (m) {
      i = Math.floor(random(seed + m) * m--)
      t = arr[m]
      arr[m] = arr[i]
      arr[i] = t
    }
    return arr
  }
  // Simple hash function for seed
  function hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash)
  }
  // Deterministic random number generator
  function random(seed: number): number {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  // On mount, check for saved game over state or return-to-game flag
  useEffect(() => {
    console.log('[GameBoard] Mount effect running');
    const saved = localStorage.getItem('anagramsGameOverState');
    const returnToGame = localStorage.getItem('anagramsReturnToGame');
    if (!hasRestoredRef.current && saved && returnToGame) {
      console.log('[GameBoard] Restoring game over state from localStorage');
      setRestoringGameOver(true);
      try {
        const parsed = JSON.parse(saved);
        if (parsed.baseWord) {
          setGameState({
            isActive: false,
            letters: parsed.baseWord.split(''),
            foundWords: parsed.foundWords,
            score: parsed.score,
            timeLeft: 0,
            baseWord: parsed.baseWord,
            currentRound: 1,
            gameId: null,
            currentLetterCount: parsed.baseWord.length,
          });
          // Restore scrambled letters
          const key = `anagramsScrambledLetters_${parsed.baseWord}`;
          const stored = localStorage.getItem(key);
          if (stored) {
            const savedOrder = JSON.parse(stored);
            if (Array.isArray(savedOrder) && savedOrder.length === parsed.baseWord.length) {
              setScrambledLetters(savedOrder);
            }
          }
        }
      } catch {}
      setShowGameOver(true);
      localStorage.removeItem('anagramsReturnToGame');
      setLoading(false);
      hasRestoredRef.current = true;
      console.log('[GameBoard] Restoration complete, returning from effect');
      return; // Prevent starting a new game after restoration
    }
    // Only start a new game if not restoring in this session
    if (!hasRestoredRef.current) {
      console.log('[GameBoard] No restoration needed, starting new game');
      localStorage.removeItem('anagramsGameOverState');
      localStorage.removeItem('anagramsReturnToGame');
      setLoading(true);
      Promise.resolve(startNewGame()).then(() => {
        setCurrentWord([]);
        setSelectedIndices([]);
        setShowGameOver(false);
        setLoading(false);
        console.log('[GameBoard] New game started');
      });
    } else {
      console.log('[GameBoard] Restoration already performed in this session, skipping new game');
    }
  }, []);

  // On new game, shuffle randomly and save to localStorage
  useEffect(() => {
    console.log('[Shuffle Effect] Running. Previous baseWord:', prevBaseWordRef.current, 'Current baseWord:', gameState.baseWord);
    prevBaseWordRef.current = gameState.baseWord;
    if (gameState.baseWord) {
      let savedOrder = null
      try {
        const key = `anagramsScrambledLetters_${gameState.baseWord}`
        const stored = localStorage.getItem(key)
        console.log('[Anagrams] Reading scrambledLetters from localStorage:', key, stored)
        if (stored) {
          savedOrder = JSON.parse(stored)
        }
      } catch (e) {
        console.log('[Anagrams] Error reading scrambledLetters from localStorage:', e)
      }
      if (savedOrder && Array.isArray(savedOrder) && savedOrder.length === gameState.baseWord.length) {
        console.log('[Anagrams] Restoring scrambledLetters from localStorage:', savedOrder)
        setScrambledLetters(savedOrder)
      } else {
        const shuffled = scrambleLetters(gameState.baseWord)
        setScrambledLetters(shuffled)
        localStorage.setItem(`anagramsScrambledLetters_${gameState.baseWord}`, JSON.stringify(shuffled))
        console.log('[Anagrams] No saved order, shuffling and saving to localStorage:', shuffled)
      }
    }
  }, [gameState.baseWord])

  const playSound = async (soundType: "correct" | "incorrect" | "bonus") => {
    if (isMuted || !gameSettings.soundEnabled || !audioGeneratorRef.current) return

    try {
      switch (soundType) {
        case "correct":
          await audioGeneratorRef.current.playCorrectSound()
          break
        case "incorrect":
          await audioGeneratorRef.current.playIncorrectSound()
          break
        case "bonus":
          await audioGeneratorRef.current.playBonusSound()
          break
      }
    } catch (error) {
      // Silently fail for audio errors
    }
  }

  const addLetterToWord = (index: number) => {
    if (selectedIndices.includes(index) || currentWord.length >= gameState.currentLetterCount) return

    setCurrentWord((prev) => [...prev, scrambledLetters[index]])
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

  // True random shuffle for the shuffle button
  function scrambleLetters(word: string): string[] {
    const letters = word.split("")
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[letters[i], letters[j]] = [letters[j], letters[i]]
    }
    return letters
  }

  const submitWord = async (wordOverride?: string) => {
    console.log('[submitWord] BEFORE: baseWord =', gameState.baseWord);
    const word = (wordOverride ?? currentWord.join("")).toLowerCase();
    console.log('[submitWord] called with:', word, 'isActive:', gameState.isActive, 'timeLeft:', gameState.timeLeft);
    // Only block if not called from auto-submit
    if (gameState.timeLeft <= 0 && !wordOverride) return;

    if (word.length < 3) {
      toast({
        title: "Word too short",
        description: "Words must be at least 3 letters long",
        variant: "destructive",
      })
      setFeedbackState("incorrect")
      playSound("incorrect")
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
      playSound("incorrect")
      setTimeout(() => setFeedbackState("idle"), 500)
      return
    }

    const isValid = await validateWord(word)

    if (isValid) {
      const wordScore = calculateScore(word.length)

      // Multiplayer: send word to server
      if (multiplayer) {
        sendWordToServer()
      }

      addFoundWord(word)
      addToScore(wordScore)

      // Play sound and show feedback
      if (word.length >= 6) {
        setFeedbackState("bonus")
        setShowSparkles(true)
        playSound("bonus")
        setTimeout(() => setShowSparkles(false), 1000)
      } else {
        setFeedbackState("correct")
        playSound("correct")
      }

      toast({
        title: "Word found!",
        description: `+${wordScore} points`,
        variant: "default",
      })
    } else {
      setFeedbackState("incorrect")
      playSound("incorrect")

      toast({
        title: "Invalid word",
        description: "Not in our dictionary",
        variant: "destructive",
      })
    }

    setTimeout(() => setFeedbackState("idle"), word.length >= 6 ? 1000 : 500)
    clearCurrentWord()
    console.log('[submitWord] AFTER: baseWord =', gameState.baseWord);
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

  // Save game over state to localStorage when game ends
  useEffect(() => {
    if (showGameOver && gameState.baseWord) {
      const gameOverState = {
        score: gameState.score,
        foundWords: gameState.foundWords,
        baseWord: gameState.baseWord,
      }
      localStorage.setItem('anagramsGameOverState', JSON.stringify(gameOverState))
    }
  }, [showGameOver, gameState.score, gameState.foundWords, gameState.baseWord])

  // For GameOverModal, use saved state if present
  let gameOverScore = gameState.score
  let gameOverFoundWords = gameState.foundWords
  let gameOverBaseWord = gameState.baseWord
  const saved = typeof window !== 'undefined' ? localStorage.getItem('anagramsGameOverState') : null
  if (showGameOver && saved) {
    try {
      const parsed = JSON.parse(saved)
      gameOverScore = parsed.score
      gameOverFoundWords = parsed.foundWords
      gameOverBaseWord = parsed.baseWord
    } catch {}
  }

  // Shuffle button handler (true random)
  const shuffleLetters = () => {
    if (!gameState.baseWord) return
    const shuffled = scrambleLetters(gameState.baseWord)
    setScrambledLetters(shuffled)
    localStorage.setItem(`anagramsScrambledLetters_${gameState.baseWord}`, JSON.stringify(shuffled))
    console.log('[Anagrams] User shuffled, saving new order to localStorage:', shuffled)
    clearCurrentWord()
  }

  // After every entry, restore the order from localStorage
  useEffect(() => {
    if (gameState.baseWord) {
      try {
        const key = `anagramsScrambledLetters_${gameState.baseWord}`
        const stored = localStorage.getItem(key)
        if (stored) {
          const savedOrder = JSON.parse(stored)
          if (Array.isArray(savedOrder) && savedOrder.length === gameState.baseWord.length) {
            setScrambledLetters(savedOrder)
          }
        }
      } catch {}
    }
    // Only runs when baseWord changes
  }, [gameState.baseWord])

  // When closing the modal or starting a new game, clear the saved state
  const handleCloseGameOver = () => {
    console.log('[GameBoard] handleCloseGameOver called, clearing restoringGameOver and hasRestoredRef');
    localStorage.removeItem('anagramsGameOverState');
    setShowGameOver(false);
    setRestoringGameOver(false);
    hasRestoredRef.current = false;
    // Navigate to landing page
    window.location.href = '/';
  };

  const handlePlayAgain = () => {
    console.log('[GameBoard] handlePlayAgain called, clearing restoringGameOver and hasRestoredRef, starting new game');
    setShowGameOver(false);
    localStorage.removeItem('anagramsGameOverState');
    setRestoringGameOver(false);
    hasRestoredRef.current = false;
    setLoading(true);
    Promise.resolve(startNewGame()).then(() => {
      setCurrentWord([]);
      setSelectedIndices([]);
      setLoading(false);
    });
  };

  // Restore keyboard input effect at the top level:
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.isActive || gameState.timeLeft <= 0 || showSettings) return;
      // Letter keys
      if (/^[a-zA-Z]$/.test(e.key)) {
        const letterIndex = scrambledLetters.findIndex(
          (l, i) => l.toLowerCase() === e.key.toLowerCase() && !selectedIndices.includes(i),
        );
        if (letterIndex !== -1) {
          addLetterToWord(letterIndex);
        }
      }
      // Backspace
      else if (e.key === "Backspace") {
        removeLastLetter();
      }
      // Delete/Escape
      else if (e.key === "Delete" || e.key === "Escape") {
        clearCurrentWord();
      }
      // Enter
      else if (e.key === "Enter") {
        submitWord();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState.isActive, gameState.timeLeft, scrambledLetters, selectedIndices, currentWord, showSettings, submitWord]);

  useEffect(() => {
    if (!gameState.isActive || gameState.timeLeft <= 0) return undefined;
    hasAutoSubmitted.current = false; // Reset for new round
    const timer = setInterval(() => {
      setGameState({ timeLeft: gameState.timeLeft - 1 });
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [gameState.isActive, gameState.timeLeft, setGameState]);

  useEffect(() => {
    // Auto-submit when timer reaches zero, only once per round
    if (gameState.isActive && gameState.timeLeft === 0 && !hasAutoSubmitted.current) {
      hasAutoSubmitted.current = true;
      const wordToSubmit = currentWordRef.current.join("");
      if (wordToSubmit.length > 0) {
        console.log('[Auto-Submit] Timer expired, auto-submitting current word:', wordToSubmit);
        submitWord(wordToSubmit).then(() => {
          endGame();
          setShowGameOver(true);
        });
      } else {
        endGame();
        setShowGameOver(true);
      }
    }
  }, [gameState.isActive, gameState.timeLeft, endGame, submitWord]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-900">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-amber-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-amber-200 text-lg font-semibold">Loading game...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar onSettingsClick={() => setShowSettings(true)} />
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-20 casino-table relative">
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
                {scrambledLetters.map((letter, i) => (
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
                onClick={() => submitWord()}
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
              <ScoreDisplay score={gameState.score} username={"Guest"} />

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
          {showDefinition && selectedWord && (
            <DefinitionModal word={selectedWord} onClose={() => setShowDefinition(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>{showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}</AnimatePresence>
        {showGameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <GameOverModal
              score={gameOverScore}
              foundWords={gameOverFoundWords}
              baseWord={gameOverBaseWord}
              onClose={handleCloseGameOver}
              onPlayAgain={handlePlayAgain}
            />
            <div className="fixed inset-0 bg-black/60 z-40" />
          </div>
        )}
      </div>
    </>
  )
}
