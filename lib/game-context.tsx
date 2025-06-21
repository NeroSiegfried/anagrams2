"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Word } from "@/lib/word-service"

interface GameSettings {
  letterCount: number
  roundDuration: number
  soundEnabled: boolean
  musicEnabled: boolean
}

interface SubWord {
  text: string
  definition: string | object // can be string or object
  // WARNING: Never render definition directly as a React child; check type first.
}

interface GameState {
  isActive: boolean
  letters: string[]
  foundWords: string[]
  score: number
  timeLeft: number
  baseWord: string | null
  currentRound: number
  gameId: string | null
  currentLetterCount: number // Track the current game's letter count
  validWords: string[] // Valid words for client-side validation (multiplayer)
  gameStatus: string // Track game status: 'waiting', 'active', 'finished'
}

interface GameContextType {
  gameSettings: GameSettings
  updateSettings: (settings: Partial<GameSettings>) => void
  startNewGame: () => void
  endGame: () => void
  resetGame: () => void
  validateWord: (word: string) => Promise<boolean>
  calculateScore: (wordLength: number) => number
  gameState: GameState
  setGameState: (state: Partial<GameState>) => void
  addToScore: (points: number) => void
  addFoundWord: (word: string) => void
  allSubWords: SubWord[]
  setAllSubWords: (words: SubWord[]) => void
  loadingWords: boolean
}

const defaultSettings: GameSettings = {
  letterCount: 6,
  roundDuration: 60,
  soundEnabled: true,
  musicEnabled: true,
}

const defaultGameState: GameState = {
  isActive: false,
  letters: [],
  foundWords: [],
  score: 0,
  timeLeft: 60,
  baseWord: null,
  currentRound: 0,
  gameId: null,
  currentLetterCount: 6, // Default letter count
  validWords: [], // Default empty array for valid words
  gameStatus: 'waiting', // Default game status
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("anagramsGameSettings")
      if (savedSettings) {
        return JSON.parse(savedSettings)
      }
    }
    return defaultSettings
  })

  const [gameState, setGameStateInternal] = useState<GameState>(defaultGameState)
  const [allSubWords, setAllSubWords] = useState<SubWord[]>([])
  const [loadingWords, setLoadingWords] = useState(false)

  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("anagramsGameSettings", JSON.stringify(gameSettings))
    }
  }, [gameSettings])

  const updateSettings = useCallback((settings: Partial<GameSettings>) => {
    setGameSettings((prev) => ({ ...prev, ...settings }))
  }, [])

  const setGameState = useCallback((newState: Partial<GameState>) => {
    setGameStateInternal((prev) => ({ ...prev, ...newState }))
  }, [])

  // Helper to scramble a word
  function scrambleLetters(word: string): string {
    const letters = word.split("")
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[letters[i], letters[j]] = [letters[j], letters[i]]
    }
    return letters.join("")
  }

  const startNewGame = useCallback(async () => {
    setLoadingWords(true)
    // Generate a unique game ID
    const newGameId = Math.random().toString(36).substring(2, 9)

    // Use the letter count from settings for the new game
    const letterCount = gameSettings.letterCount
    let baseWord = ""
    try {
      const response = await fetch(`/api/random-word?length=${letterCount}`)
      if (response.ok) {
        const data = await response.json()
        baseWord = data.word
      }
    } catch (e) {
      console.warn("Error fetching random base word:", e)
      baseWord = ""
    }
    if (!baseWord) {
      // fallback: use a hardcoded word if DB fails
      baseWord = "anagram"
    }
    const scrambled = scrambleLetters(baseWord)

    // Fetch all valid subwords/anagrams from the database using the API endpoint
    let subwords: Word[] = []
    try {
      const response = await fetch(`/api/possible-words?letters=${encodeURIComponent(baseWord)}&withoutDefinitions=true`)
      if (response.ok) {
        const data = await response.json()
        // Convert the simplified word objects to Word[] format
        subwords = (data.words || []).map((w: { word: string; length: number }) => ({
          id: w.word,
          word: w.word,
          length: w.length,
          is_common: false,
          definition: null,
          created_at: new Date().toISOString(),
        }))
      }
    } catch (e) {
      console.warn("Error fetching subwords:", e)
      subwords = []
    }
    
    // Map Word[] to SubWord[]
    const subWordList: SubWord[] = subwords.map((w) => {
      let parsedDef: string | object = ""
      if (w.definition) {
        try {
          parsedDef = JSON.parse(w.definition)
        } catch {
          parsedDef = w.definition
        }
      }
      return { text: w.word, definition: parsedDef }
    })
    setAllSubWords(subWordList)

    setGameStateInternal({
      isActive: true,
      letters: scrambled.split(""),
      foundWords: [],
      score: 0,
      timeLeft: gameSettings.roundDuration,
      baseWord: baseWord, // Set the base word
      currentRound: gameState.currentRound + 1,
      gameId: newGameId,
      currentLetterCount: letterCount, // Set the current game's letter count
      validWords: subwords.map(w => w.word), // Set valid words for client-side validation
      gameStatus: 'active', // Set game status to active
    })
    setLoadingWords(false)
  }, [gameSettings, gameState.currentRound, setAllSubWords])

  const endGame = useCallback(() => {
    setGameState({ isActive: false })
  }, [setGameState])

  const resetGame = useCallback(() => {
    setGameStateInternal(defaultGameState)
  }, [])

  const validateWord = useCallback(async (word: string): Promise<boolean> => {
    // Use pre-fetched allSubWords for validation
    return allSubWords.some((w) => w.text.toLowerCase() === word.toLowerCase())
  }, [allSubWords])

  const calculateScore = useCallback((wordLength: number): number => {
    if (wordLength === 3) return 100
    if (wordLength === 4) return 300
    if (wordLength === 5) return 1200
    if (wordLength === 6) return 2000
    return 2000 + 400 * (wordLength - 6)
  }, [])

  const addToScore = useCallback(
    (points: number) => {
      setGameState({ score: gameState.score + points })
    },
    [gameState.score, setGameState],
  )

  const addFoundWord = useCallback(
    (word: string) => {
      setGameState({ foundWords: [...gameState.foundWords, word] })
    },
    [gameState.foundWords, setGameState],
  )

  return (
    <GameContext.Provider
      value={{
        gameSettings,
        updateSettings,
        startNewGame,
        endGame,
        resetGame,
        validateWord,
        calculateScore,
        gameState,
        setGameState,
        addToScore,
        addFoundWord,
        allSubWords,
        setAllSubWords,
        loadingWords,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
