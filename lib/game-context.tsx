"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useToast } from "@/components/ui/use-toast"

interface GameSettings {
  letterCount: number
  roundDuration: number
  soundEnabled: boolean
  musicEnabled: boolean
}

interface SubWord {
  text: string
  definition: string
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
}

interface GameContextType {
  gameSettings: GameSettings
  updateSettings: (settings: Partial<GameSettings>) => void
  startNewGame: () => void
  endGame: () => void
  resetGame: () => void
  validateWord: (word: string) => Promise<boolean>
  calculateScore: (wordLength: number) => number
  scrambleWord: (length: number) => string
  gameState: GameState
  setGameState: (state: Partial<GameState>) => void
  addToScore: (points: number) => void
  addFoundWord: (word: string) => void
  allSubWords: SubWord[]
  setAllSubWords: (words: SubWord[]) => void
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

  const startNewGame = useCallback(() => {
    // Generate a unique game ID
    const newGameId = Math.random().toString(36).substring(2, 9)

    // Use the letter count from settings for the new game
    const letterCount = gameSettings.letterCount
    const scrambled = scrambleWord(letterCount)

    setGameStateInternal({
      isActive: true,
      letters: scrambled.split(""),
      foundWords: [],
      score: 0,
      timeLeft: gameSettings.roundDuration,
      baseWord: null, // This will be set properly in scrambleWord
      currentRound: gameState.currentRound + 1,
      gameId: newGameId,
      currentLetterCount: letterCount, // Set the current game's letter count
    })
  }, [gameSettings, gameState.currentRound])

  const endGame = useCallback(() => {
    setGameState({ isActive: false })
  }, [setGameState])

  const resetGame = useCallback(() => {
    setGameStateInternal(defaultGameState)
  }, [])

  const validateWord = useCallback(async (word: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/validate-word?word=${word}`)
      const data = await response.json()
      return data.valid
    } catch (error) {
      console.error("Error validating word:", error)
      return false
    }
  }, [])

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

  const scrambleWord = useCallback(
    (length: number): string => {
      const baseWords = {
        6: [
          "anagram",
          "puzzle",
          "gaming",
          "letter",
          "player",
          "points",
          "winner",
          "master",
          "genius",
          "wordle",
          "scribe",
          "typing",
          "coding",
          "syntax",
          "script",
          "design",
          "create",
          "invent",
          "system",
        ],
        7: [
          "anagrams",
          "puzzles",
          "letters",
          "players",
          "winners",
          "masters",
          "scripts",
          "designs",
          "creates",
          "invents",
          "systems",
        ],
        8: [
          "scramble",
          "unscramble",
          "wordplay",
          "gameplay",
          "keyboard",
          "computer",
          "software",
          "hardware",
          "internet",
        ],
        9: [
          "anagrammed",
          "scrambled",
          "unscrambled",
          "wordplays",
          "gameplays",
          "keyboards",
          "computers",
          "softwares",
          "hardwares",
        ],
        10: [
          "anagramming",
          "scrambling",
          "unscrambling",
          "programming",
          "developing",
          "engineering",
          "technology",
          "algorithms",
        ],
      }

      const wordsForLength = baseWords[length as keyof typeof baseWords] || baseWords[6]
      const randomIndex = Math.floor(Math.random() * wordsForLength.length)
      const baseWord = wordsForLength[randomIndex]

      // Update the base word in game state
      setGameState({ baseWord })

      // Scramble the letters
      const letters = baseWord.split("")
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[letters[i], letters[j]] = [letters[j], letters[i]]
      }

      return letters.join("")
    },
    [setGameState],
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
        scrambleWord,
        gameState,
        setGameState,
        addToScore,
        addFoundWord,
        allSubWords,
        setAllSubWords,
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
