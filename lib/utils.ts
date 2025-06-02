import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Dictionary utilities
export async function validateWord(word: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/validate-word?word=${word}`)
    const data = await response.json()
    return data.valid
  } catch (error) {
    console.error("Error validating word:", error)
    return false
  }
}

export async function getWordDefinition(word: string) {
  try {
    const response = await fetch(`/api/dictionary?word=${word}`)
    if (!response.ok) {
      throw new Error("Failed to fetch definition")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching definition:", error)
    throw error
  }
}

// Game utilities
export function calculateScore(wordLength: number): number {
  if (wordLength === 3) return 100
  if (wordLength === 4) return 300
  if (wordLength === 5) return 1200
  return 2000 // 6+ letters
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}
