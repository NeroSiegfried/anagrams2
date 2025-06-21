"use client"

import { useState, useRef, useLayoutEffect, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { DatabaseStatus } from "@/components/database-status"
import { Play, Users, Settings, Trophy } from "lucide-react"
import { Navbar } from "@/components/navbar"

export function LandingPage() {
  const { user, loading: authLoading } = useAuth()
  const [tileSize, setTileSize] = useState(56); // px, default desktop size
  const [isHydrated, setIsHydrated] = useState(false)
  const tileContainerRef = useRef<HTMLDivElement>(null);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Calculate tile size based on container width for 8 letters in one line
  useLayoutEffect(() => {
    if (!isHydrated) return // Don't run until hydrated
    
    function updateTileSize() {
      if (!tileContainerRef.current) return;
      const containerWidth = tileContainerRef.current.offsetWidth;
      const letterCount = 8; // "ANAGRAMS" has 8 letters
      // 2px margin per tile (1px each side)
      const margin = 2;
      // Calculate max tile size for the row
      let size = Math.floor((containerWidth - margin * (letterCount - 1)) / letterCount);
      // Clamp to desktop max (56px)
      size = Math.min(size, 56);
      setTileSize(size);
    }
    updateTileSize();
    window.addEventListener('resize', updateTileSize);
    return () => window.removeEventListener('resize', updateTileSize);
  }, [isHydrated]);

  const letterVariants = {
    initial: { y: -100, opacity: 0, rotateX: -90 },
    animate: (i: number) => ({
      y: 0,
      opacity: 1,
      rotateX: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        type: "spring" as const,
        stiffness: 100,
      },
    }),
  }

  const cardVariants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
    hover: {
      y: -8,
      transition: {
        duration: 0.2,
        ease: "easeInOut" as const,
      },
    },
  }

  return (
    <>
      <Navbar />
      <DatabaseStatus />
      <div className="min-h-screen flex flex-col items-center justify-center p-0 sm:p-4 pt-16 sm:pt-20 casino-table">
        {/* Show loading state while auth is loading */}
        {authLoading && (
          <div className="flex flex-col items-center justify-center">
            <svg className="animate-spin h-12 w-12 text-amber-300 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-amber-200 text-lg font-semibold">Loading...</span>
          </div>
        )}
        
        {/* Show main content when not loading */}
        {!authLoading && (
          <div className="w-full max-w-6xl mx-auto text-center p-2 sm:p-0">
            <div className="flex justify-center mb-4 sm:mb-8" ref={tileContainerRef}>
              {["A", "N", "A", "G", "R", "A", "M", "S"].map((letter, i) => (
                <motion.div
                  key={i}
                  className="letter-tile"
                  variants={letterVariants}
                  initial="initial"
                  animate="animate"
                  custom={i}
                  style={{
                    width: tileSize,
                    height: tileSize,
                    marginLeft: i === 0 ? 0 : 2,
                    fontSize: tileSize * 0.8,
                    minWidth: tileSize,
                    minHeight: tileSize,
                    maxWidth: 56,
                    maxHeight: 56,
                  }}
                >
                  <span 
                    className="font-bold text-amber-900 z-10 relative"
                    style={{ fontSize: tileSize * 0.8 }}
                  >
                    {letter}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.h1
              className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 text-amber-100 drop-shadow-lg px-2 sm:px-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Unscramble Your Way to Victory!
            </motion.h1>

            <motion.p
              className="text-base sm:text-lg md:text-xl mb-6 sm:mb-12 text-amber-200 max-w-2xl mx-auto px-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              A cozy word-play challenge with casino-style elegance. Play solo or challenge friends in real-time
              multiplayer matches!
            </motion.p>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-12 px-2 sm:px-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <motion.div
                className="game-card p-3 sm:p-6 rounded-xl border-2 border-amber-600 shadow-xl cursor-pointer"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                transition={{ delay: 1.4 }}
              >
                <Play className="h-8 w-8 sm:h-12 sm:w-12 text-amber-300 mx-auto mb-2 sm:mb-4" />
                <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3 text-amber-100">Single Player</h2>
                <p className="text-sm sm:text-base text-amber-200 mb-4 sm:mb-6">Challenge yourself with increasingly difficult word puzzles.</p>
                <Link href="/play">
                  <Button className="w-full wood-button text-amber-900 font-semibold py-2 sm:py-3 text-sm sm:text-base">Play Now</Button>
                </Link>
              </motion.div>

              <motion.div
                className="game-card p-3 sm:p-6 rounded-xl border-2 border-amber-600 shadow-xl cursor-pointer"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                transition={{ delay: 1.6 }}
              >
                <Users className="h-8 w-8 sm:h-12 sm:w-12 text-amber-300 mx-auto mb-2 sm:mb-4" />
                <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3 text-amber-100">Multiplayer</h2>
                <p className="text-sm sm:text-base text-amber-200 mb-4 sm:mb-6">Compete against friends or random players in real-time matches.</p>
                <Link href="/play/multiplayer">
                  <Button className="w-full wood-button text-amber-900 font-semibold py-2 sm:py-3 text-sm sm:text-base">
                    Find Match
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                className="game-card p-3 sm:p-6 rounded-xl border-2 border-amber-600 shadow-xl cursor-pointer"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                transition={{ delay: 1.8 }}
              >
                <Settings className="h-8 w-8 sm:h-12 sm:w-12 text-amber-300 mx-auto mb-2 sm:mb-4" />
                <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-3 text-amber-100">Customize</h2>
                <p className="text-sm sm:text-base text-amber-200 mb-4 sm:mb-6">Adjust game settings to match your skill level and preferences.</p>
                <Link href="/settings">
                  <Button className="w-full wood-button text-amber-900 font-semibold py-2 sm:py-3 text-sm sm:text-base">Settings</Button>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="text-center mb-4 sm:mb-8 px-2 sm:px-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 0.5 }}
            >
              {user ? (
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <Trophy className="text-amber-300" />
                  <p className="text-sm sm:text-lg text-amber-100">
                    Welcome back,{" "}
                    <span className="font-bold text-amber-300">{user.displayName || user.username}</span>!
                  </p>
                  <Link href="/profile">
                    <Button className="wood-button text-amber-900 font-semibold py-1 sm:py-2 text-sm">
                      View Profile
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <p className="text-sm sm:text-lg text-amber-200">
                    Ready to start your word adventure?
                  </p>
                  <Link href="/play">
                    <Button className="wood-button text-amber-900 font-semibold py-1 sm:py-2 text-sm">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </>
  )
}
