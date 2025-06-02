"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-amber-900 capitalize">{word}</h2>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>
        ) : definition ? (
          <div className="space-y-4">
            {definition.phonetic && <p className="text-amber-700 italic">{definition.phonetic}</p>}

            {definition.meanings.map((meaning, i) => (
              <div key={i} className="border-t pt-3">
                <h3 className="font-semibold text-amber-800 mb-2">{meaning.partOfSpeech}</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  {meaning.definitions.slice(0, 3).map((def, j) => (
                    <li key={j} className="text-amber-900">
                      <p>{def.definition}</p>
                      {def.example && <p className="text-amber-700 italic mt-1">"{def.example}"</p>}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-amber-700">No definition found.</p>
        )}

        <div className="mt-6">
          <Button onClick={onClose} className="w-full bg-amber-600 hover:bg-amber-700">
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
