"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Database, ExternalLink, X, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DatabaseStatus() {
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">("checking")
  const [showDetails, setShowDetails] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isPopulating, setIsPopulating] = useState(false)
  const [populationStatus, setPopulationStatus] = useState<string>("")

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const response = await fetch("/api/health")
        if (response.ok) {
          setDbStatus("connected")
        } else {
          setDbStatus("error")
        }
      } catch (error) {
        setDbStatus("error")
      }
    }

    checkDatabase()
  }, [])

  const handlePopulateDictionary = async () => {
    setIsPopulating(true)
    setPopulationStatus("Starting dictionary population...")

    try {
      const response = await fetch("/api/populate-dictionary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (result.success) {
        setPopulationStatus(
          `Success! Added ${result.stats.successfullyAdded} words with ${result.stats.errors} errors.`,
        )
      } else {
        setPopulationStatus(`Error: ${result.details || "Failed to populate dictionary"}`)
      }
    } catch (error) {
      setPopulationStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsPopulating(false)
    }
  }

  // Don't show anything if checking, connected, or dismissed
  if (dbStatus === "checking" || dbStatus === "connected" || dismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-20 left-4 right-4 z-40 mx-auto max-w-md"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.5 }}
      >
        <div className="game-card border-2 border-amber-600 rounded-lg p-4 shadow-lg relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 text-amber-300 hover:text-amber-100 hover:bg-amber-600/20"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-300 mr-2" />
            <h3 className="text-lg font-semibold text-amber-100">Offline Mode</h3>
          </div>

          <p className="text-amber-200 text-sm mb-3">
            Running without database. User accounts and score saving are disabled, but you can still play!
          </p>

          <div className="flex items-center space-x-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              className="border-amber-600 text-amber-100 hover:bg-amber-600 hover:text-amber-900"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Database className="h-4 w-4 mr-1" />
              {showDetails ? "Hide" : "Show"} Setup Info
            </Button>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                className="mt-3 p-3 bg-amber-900/20 rounded border border-amber-600"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-amber-200 text-xs mb-2">To enable full functionality:</p>
                <ol className="text-amber-200 text-xs space-y-1 list-decimal list-inside mb-3">
                  <li>Get a free Neon database</li>
                  <li>Add DATABASE_URL environment variable</li>
                  <li>Run the table creation script</li>
                  <li>Populate the dictionary</li>
                  <li>Restart the application</li>
                </ol>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-amber-600 text-amber-100 hover:bg-amber-600 hover:text-amber-900"
                    onClick={handlePopulateDictionary}
                    disabled={isPopulating}
                  >
                    {isPopulating ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Populating...
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3 mr-1" />
                        Populate Dictionary
                      </>
                    )}
                  </Button>

                  {populationStatus && (
                    <p className="text-xs text-amber-200 bg-amber-900/30 p-2 rounded">{populationStatus}</p>
                  )}
                </div>

                <a
                  href="https://neon.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-amber-300 hover:text-amber-100 text-xs mt-2"
                >
                  Get Free Database <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
