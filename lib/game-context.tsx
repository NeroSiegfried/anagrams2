"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface GameSettings {
  letterCount: number
  roundDuration: number
  soundEnabled: boolean
  musicEnabled: boolean
}

interface GameContextType {
  gameSettings: GameSettings
  updateSettings: (settings: Partial<GameSettings>) => void
  startGame: () => void
  endGame: () => void
  validateWord: (word: string) => Promise<boolean>
  calculateScore: (wordLength: number) => number
  scrambleWord: (length: number) => string
  isGameActive: boolean
  currentRound: number
  score: number
  addToScore: (points: number) => void
}

const defaultSettings: GameSettings = {
  letterCount: 6,
  roundDuration: 60,
  soundEnabled: true,
  musicEnabled: true,
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    // Load settings from localStorage if available
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("anagramsGameSettings")
      if (savedSettings) {
        return JSON.parse(savedSettings)
      }
    }
    return defaultSettings
  })

  const [isGameActive, setIsGameActive] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)
  const [score, setScore] = useState(0)

  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("anagramsGameSettings", JSON.stringify(gameSettings))
    }
  }, [gameSettings])

  const updateSettings = (settings: Partial<GameSettings>) => {
    setGameSettings((prev) => ({ ...prev, ...settings }))
  }

  const startGame = () => {
    setIsGameActive(true)
    setCurrentRound((prev) => prev + 1)
    setScore(0)
  }

  const endGame = () => {
    setIsGameActive(false)
  }

  const validateWord = async (word: string): Promise<boolean> => {
    try {
      // In a real implementation, this would validate against a dictionary API
      const response = await fetch(`/api/validate-word?word=${word}`)
      const data = await response.json()
      return data.valid
    } catch (error) {
      console.error("Error validating word:", error)
      return false
    }
  }

  const calculateScore = (wordLength: number): number => {
    if (wordLength === 3) return 100
    if (wordLength === 4) return 300
    if (wordLength === 5) return 1200
    return 2000 // 6+ letters
  }

  const addToScore = (points: number) => {
    setScore((prev) => prev + points)
  }

  const scrambleWord = (length: number): string => {
    // In a real implementation, this would fetch a random word from a dictionary API
    // For now, we'll use a predefined list of words
    const sixLetterWords = [
      "anagram",
      "puzzle",
      "gaming",
      "letter",
      "player",
      "points",
      "winner",
      "losing",
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
    ]

    // Select a random word from the list
    const randomIndex = Math.floor(Math.random() * sixLetterWords.length)
    let word = sixLetterWords[randomIndex]

    // If the requested length is different from 6, adjust the word
    if (length > 6) {
      // Add random letters to make it longer
      const extraLetters = "abcdefghijklmnopqrstuvwxyz"
      for (let i = 6; i < length; i++) {
        const randomLetter = extraLetters[Math.floor(Math.random() * extraLetters.length)]
        word += randomLetter
      }
    }

    // Scramble the letters
    const letters = word.split("")
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[letters[i], letters[j]] = [letters[j], letters[i]]
    }

    return letters.join("")
  }

  return (
    <GameContext.Provider
      value={{
        gameSettings,
        updateSettings,
        startGame,
        endGame,
        validateWord,
        calculateScore,
        scrambleWord,
        isGameActive,
        currentRound,
        score,
        addToScore,
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
