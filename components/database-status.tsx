"use client"

import { Database, CheckCircle } from 'lucide-react'
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function DatabaseStatus() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Hide the popup after 3 seconds
    const timer = setTimeout(() => {
      setShow(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3 }}
        >
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Database Connected (Neon)</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
