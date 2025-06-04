"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"
import { DatabaseStatus } from "@/components/database-status"
import { Play, Users, Settings, Trophy } from "lucide-react"
import { Navbar } from "@/components/navbar"

export function LandingPage() {
  const { user, dbError } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  const letterVariants = {
    initial: { y: -100, opacity: 0, rotateX: -90 },
    animate: (i: number) => ({
      y: 0,
      opacity: 1,
      rotateX: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        type: "spring",
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
        ease: "easeOut",
      },
    },
    hover: {
      y: -8,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  }

  return (
    <>
      <Navbar />
      <DatabaseStatus />
      <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-20 casino-table">
        <div className="w-full max-w-6xl mx-auto text-center">
          <div className="flex flex-wrap justify-center mb-8">
            {["A", "N", "A", "G", "R", "A", "M", "S"].map((letter, i) => (
              <motion.div
                key={i}
                className="letter-tile mx-1"
                variants={letterVariants}
                initial="initial"
                animate="animate"
                custom={i}
              >
                <span className="text-2xl font-bold text-amber-900 z-10 relative">{letter}</span>
              </motion.div>
            ))}
          </div>

          <motion.h1
            className="text-4xl sm:text-5xl font-bold mb-4 text-amber-100 drop-shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            Unscramble Your Way to Victory!
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl mb-12 text-amber-200 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            A cozy word-play challenge with casino-style elegance. Play solo or challenge friends in real-time
            multiplayer matches!
          </motion.p>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <motion.div
              className="game-card p-6 rounded-xl border-2 border-amber-600 shadow-xl cursor-pointer"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              transition={{ delay: 1.4 }}
            >
              <Play className="h-12 w-12 text-amber-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3 text-amber-100">Single Player</h2>
              <p className="text-amber-200 mb-6">Challenge yourself with increasingly difficult word puzzles.</p>
              <Link href="/play">
                <Button className="w-full wood-button text-amber-900 font-semibold py-3">Play Now</Button>
              </Link>
            </motion.div>

            <motion.div
              className="game-card p-6 rounded-xl border-2 border-amber-600 shadow-xl cursor-pointer"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              transition={{ delay: 1.6 }}
            >
              <Users className="h-12 w-12 text-amber-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3 text-amber-100">Multiplayer</h2>
              <p className="text-amber-200 mb-6">Compete against friends or random players in real-time matches.</p>
              <Link href="/play/multiplayer">
                <Button className="w-full wood-button text-amber-900 font-semibold py-3" disabled={dbError}>
                  {dbError ? "Requires Supabase" : "Find Match"}
                </Button>
              </Link>
            </motion.div>

            <motion.div
              className="game-card p-6 rounded-xl border-2 border-amber-600 shadow-xl cursor-pointer"
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              transition={{ delay: 1.8 }}
            >
              <Settings className="h-12 w-12 text-amber-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3 text-amber-100">Customize</h2>
              <p className="text-amber-200 mb-6">Adjust game settings to match your skill level and preferences.</p>
              <Link href="/settings">
                <Button className="w-full wood-button text-amber-900 font-semibold py-3">Settings</Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
          >
            {user ? (
              <div className="flex items-center justify-center space-x-4">
                <Trophy className="text-amber-300" />
                <p className="text-amber-100 text-lg">
                  Welcome back,{" "}
                  <span className="font-bold text-amber-300">{user.user_metadata?.username || user.email}</span>!
                </p>
                <Link href="/profile">
                  <Button
                    variant="outline"
                    className="border-amber-600 text-amber-100 hover:bg-amber-600 hover:text-amber-900"
                  >
                    View Profile
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-amber-200">
                {dbError ? (
                  "Supabase offline - playing as guest"
                ) : (
                  <>
                    Optional:{" "}
                    <button
                      onClick={() => setShowLogin(true)}
                      className="text-amber-300 underline hover:text-amber-100 font-semibold"
                    >
                      Log in
                    </button>{" "}
                    or{" "}
                    <button
                      onClick={() => setShowSignup(true)}
                      className="text-amber-300 underline hover:text-amber-100 font-semibold"
                    >
                      sign up
                    </button>{" "}
                    to save your progress and play ranked matches.
                  </>
                )}
              </p>
            )}
          </motion.div>

          <motion.div
            className="text-sm text-amber-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.5 }}
          >
            Built with Next.js 14, Supabase, and Tailwind CSS
          </motion.div>
        </div>

        {showLogin && !dbError && (
          <LoginModal
            onClose={() => setShowLogin(false)}
            onSignupClick={() => {
              setShowLogin(false)
              setShowSignup(true)
            }}
          />
        )}
        {showSignup && !dbError && (
          <SignupModal
            onClose={() => setShowSignup(false)}
            onLoginClick={() => {
              setShowSignup(false)
              setShowLogin(true)
            }}
          />
        )}
      </div>
    </>
  )
}
