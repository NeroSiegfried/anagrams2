"use client"

import { motion } from "framer-motion"

interface TileProps {
  letter: string
  onClick: () => void
  disabled?: boolean
}

export function Tile({ letter, onClick, disabled = false }: TileProps) {
  return (
    <motion.div
      className={`relative flex items-center justify-center w-14 h-14 bg-[#F5DEB3] border-2 border-[#C19A6B] rounded-md shadow-md select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
      whileHover={disabled ? {} : { scale: 1.05, backgroundColor: "#E6C9A3" }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={disabled ? undefined : onClick}
    >
      <span className="text-2xl font-bold text-black">{letter}</span>
    </motion.div>
  )
}
