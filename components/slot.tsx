"use client"

interface SlotProps {
  letter: string
  state: "idle" | "correct" | "incorrect" | "bonus"
}

export function Slot({ letter, state }: SlotProps) {
  const getStateStyles = () => {
    switch (state) {
      case "correct":
        return "bg-[#86EFAC] border-[#22C55E]"
      case "incorrect":
        return "bg-[#FCA5A5] border-[#EF4444]"
      case "bonus":
        return "bg-[#FDE047] border-[#FACC15]"
      default:
        return letter ? "bg-[#004d00] border-[#C19A6B]" : "bg-[#006400] border-[#C19A6B]"
    }
  }

  return (
    <div
      className={`flex items-center justify-center w-14 h-14 ${getStateStyles()} rounded-md shadow-sm transition-colors duration-300`}
    >
      <span className="text-2xl font-bold text-white">{letter}</span>
    </div>
  )
}
