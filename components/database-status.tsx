"use client"

import { Database, CheckCircle, XCircle } from 'lucide-react'
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function DatabaseStatus() {
  const [show, setShow] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkDatabaseConnection = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        
        if (response.ok) {
          const data = await response.json()
          setIsConnected(data.status === 'ok')
        } else {
          setIsConnected(false)
        }
      } catch (error) {
        console.error('Database connection check failed:', error)
        setIsConnected(false)
      } finally {
        setIsLoading(false)
        setShow(true)
        
        // Hide the popup after 3 seconds
        const timer = setTimeout(() => {
          setShow(false)
        }, 3000)

        return () => clearTimeout(timer)
      }
    }

    checkDatabaseConnection()
  }, [])

  if (isLoading || !show) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${
            isConnected 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3 }}
        >
          {isConnected ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            {isConnected ? 'Database Connected (Neon)' : 'Database Connection Failed'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
