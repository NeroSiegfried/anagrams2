"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Database, ExternalLink, X, Download, Loader2, CheckCircle, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase"

export function DatabaseStatus() {
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">("checking")
  const [showDetails, setShowDetails] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isPopulating, setIsPopulating] = useState(false)
  const [populationStatus, setPopulationStatus] = useState<string>("")

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const supabase = getSupabaseClient()

        if (!supabase) {
          setDbStatus("error")
          return
        }

        // Try a simple query to test the connection
        const { data, error } = await supabase.from("words").select("count").limit(1)

        if (error) {
          console.error("Supabase connection error:", error)
          setDbStatus("error")
        } else {
          setDbStatus("connected")
        }
      } catch (error) {
        console.error("Database check error:", error)
        setDbStatus("error")
      }
    }

    checkDatabase()
  }, [])

  const handlePopulateDictionary = async () => {
    setIsPopulating(true)
    setPopulationStatus("Starting dictionary population...")

    try {
      const response = await fetch("/api/populate-supabase-dictionary", {
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
        // Recheck database status
        setTimeout(() => setDbStatus("connected"), 2000)
      } else {
        setPopulationStatus(`Error: ${result.details || "Failed to populate dictionary"}`)
      }
    } catch (error) {
      setPopulationStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsPopulating(false)
    }
  }

  // Don't show anything if checking or dismissed
  if (dbStatus === "checking" || dismissed) {
    return null
  }

  // Show success message briefly if connected
  if (dbStatus === "connected") {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed top-20 left-4 right-4 z-40 mx-auto max-w-md"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
        >
          <div className="game-card border-2 border-green-600 rounded-lg p-4 shadow-lg relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-green-300 hover:text-green-100 hover:bg-green-600/20"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex items-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
              <h3 className="text-lg font-semibold text-green-100">Supabase Connected</h3>
            </div>

            <p className="text-green-200 text-sm">
              Database is online! All features including multiplayer, user accounts, and leaderboards are available.
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    )
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
            <h3 className="text-lg font-semibold text-amber-100">Supabase Setup Required</h3>
          </div>

          <p className="text-amber-200 text-sm mb-3">
            Supabase is not configured. Multiplayer, user accounts, and enhanced features are disabled.
          </p>

          <div className="flex items-center space-x-2 mb-3">
            <Button
              className="wood-button text-amber-900 font-semibold"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Database className="h-4 w-4 mr-1" />
              {showDetails ? "Hide" : "Show"} Setup Info
            </Button>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                className="mt-3 p-3 score-card rounded border border-amber-600"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start mb-2">
                  <Info className="h-4 w-4 text-amber-300 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-amber-200 text-xs mb-2">Required environment variables:</p>
                    <ul className="text-amber-200 text-xs space-y-1 mb-3 font-mono">
                      <li>• NEXT_PUBLIC_SUPABASE_URL</li>
                      <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                      <li>• SUPABASE_SUPABASE_SERVICE_ROLE_KEY (for admin)</li>
                    </ul>
                    <p className="text-amber-200 text-xs mb-2">Setup steps:</p>
                    <ol className="text-amber-200 text-xs space-y-1 list-decimal list-inside mb-3">
                      <li>Create a free Supabase project at supabase.com</li>
                      <li>Add the environment variables above to your project</li>
                      <li>Add the environment variables to your project</li>
                      <li>Enable authentication in your Supabase project</li>
                      <li>Run the SQL setup script in Supabase SQL editor</li>
                      <li>Populate the dictionary using the button below.</li>
                    </ol>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full wood-button text-amber-900 font-semibold"
                    size="sm"
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
                    <p className="text-xs text-amber-200 score-card p-2 rounded">{populationStatus}</p>
                  )}
                </div>

                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-amber-300 hover:text-amber-100 text-xs mt-2"
                >
                  Get Free Supabase Project <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
