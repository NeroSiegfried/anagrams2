"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"

export function LandingPage() {
  const { user } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  const letterVariants = {
    initial: { y: -100, opacity: 0 },
    animate: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        type: "spring",
        stiffness: 100,
      },
    }),
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-amber-50 to-amber-100">
      <div className="w-full max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-8">
          {["A", "N", "A", "G", "R", "A", "M", "S"].map((letter, i) => (
            <motion.div
              key={i}
              className="letter-tile mx-1 bg-amber-100 border-amber-700"
              variants={letterVariants}
              initial="initial"
              animate="animate"
              custom={i}
            >
              {letter}
            </motion.div>
          ))}
        </div>

        <motion.h1
          className="text-4xl font-bold mb-4 text-amber-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          Unscramble Your Way to Victory!
        </motion.h1>

        <motion.p
          className="text-lg mb-8 text-amber-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          A fun, cozy word game for word enthusiasts of all levels. Play solo or challenge friends in real-time
          multiplayer matches!
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <Link href="/play">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700">
              Play as Guest
            </Button>
          </Link>
          {user ? (
            <Link href="/profile">
              <Button size="lg" variant="outline" className="border-amber-600 text-amber-800">
                My Profile
              </Button>
            </Link>
          ) : (
            <>
              <Button
                size="lg"
                variant="outline"
                className="border-amber-600 text-amber-800"
                onClick={() => setShowLogin(true)}
              >
                Log In
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-amber-600 text-amber-800"
                onClick={() => setShowSignup(true)}
              >
                Sign Up
              </Button>
            </>
          )}
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.5 }}
        >
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-2 text-amber-800">Single Player</h2>
            <p className="text-amber-700 mb-4">Challenge yourself with increasingly difficult word puzzles.</p>
            <Link href="/play">
              <Button className="w-full bg-amber-500 hover:bg-amber-600">Play Now</Button>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-2 text-amber-800">Multiplayer</h2>
            <p className="text-amber-700 mb-4">Compete against friends or random players in real-time matches.</p>
            <Link href="/play/multiplayer">
              <Button className="w-full bg-amber-500 hover:bg-amber-600">Find Match</Button>
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-2 text-amber-800">Customize</h2>
            <p className="text-amber-700 mb-4">Adjust game settings to match your skill level and preferences.</p>
            <Link href="/settings">
              <Button className="w-full bg-amber-500 hover:bg-amber-600">Settings</Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
    </div>
  )
}
