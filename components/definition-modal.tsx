"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Loader2, BookOpen } from "lucide-react"

interface DefinitionModalProps {
  word: string
  onClose: () => void
}

interface WordDefinition {
  word: string
  phonetic?: string
  meanings: {
    partOfSpeech: string
    definitions: {
      definition: string
      example?: string
    }[]
  }[]
}

export function DefinitionModal({ word, onClose }: DefinitionModalProps) {
  const [definition, setDefinition] = useState<WordDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDefinition = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/dictionary?word=${word}`)

        if (!response.ok) {
          throw new Error("Could not find definition")
        }

        const data = await response.json()
        setDefinition(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch definition")
      } finally {
        setLoading(false)
      }
    }

    fetchDefinition()
  }, [word])

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="game-card border-4 border-amber-600 rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center mb-4">
          <BookOpen className="h-6 w-6 text-amber-300 mr-2" />
          <h2 className="text-2xl font-bold text-amber-100 capitalize">{word}</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-amber-300" />
            <span className="ml-2 text-amber-200">Loading definition...</span>
          </div>
        ) : error ? (
          <div className="score-card rounded-lg p-4 mb-4">
            <div className="text-red-300 text-center">
              <p className="font-semibold mb-2">Definition not found</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : definition ? (
          <div className="space-y-4 mb-6">
            {definition.phonetic && <p className="text-amber-300 italic text-center">{definition.phonetic}</p>}

            {definition.meanings.map((meaning, i) => (
              <div key={i} className="score-card rounded-lg p-4">
                <h3 className="font-semibold text-amber-300 mb-3 capitalize">{meaning.partOfSpeech}</h3>
                <ol className="list-decimal pl-5 space-y-3">
                  {meaning.definitions.slice(0, 3).map((def, j) => (
                    <li key={j} className="text-amber-100">
                      <p className="mb-1">{def.definition}</p>
                      {def.example && (
                        <p className="text-amber-300 italic text-sm bg-amber-900/20 p-2 rounded border-l-2 border-amber-600">
                          "{def.example}"
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ) : (
          <div className="score-card rounded-lg p-4 mb-4">
            <p className="text-amber-300 text-center">No definition found for this word.</p>
          </div>
        )}

        <Button onClick={onClose} className="w-full wood-button text-amber-900 font-semibold py-3">
          Close
        </Button>
      </motion.div>
    </motion.div>
  )
}
