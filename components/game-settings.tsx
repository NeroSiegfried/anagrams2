"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useGame } from "@/lib/game-context"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export function GameSettings() {
  const { gameSettings, updateSettings } = useGame()
  const { toast } = useToast()
  {
    const { gameSettings, updateSettings } = useGame()
    const { toast } = useToast()

    const [letterCount, setLetterCount] = useState(gameSettings.letterCount)
    const [roundDuration, setRoundDuration] = useState(gameSettings.roundDuration)
    const [soundEnabled, setSoundEnabled] = useState(gameSettings.soundEnabled)
    const [musicEnabled, setMusicEnabled] = useState(gameSettings.musicEnabled)

    const handleSaveSettings = () => {
      updateSettings({
        letterCount,
        roundDuration,
        soundEnabled,
        musicEnabled,
      })

      toast({
        title: "Settings saved",
        description: "Your game settings have been updated",
      })
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 game-board">
        <div className="w-full max-w-md mx-auto bg-white/90 rounded-xl shadow-xl p-6">
          <h1 className="text-3xl font-bold mb-6 text-center text-amber-900">Game Settings</h1>

          <div className="space-y-8">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-amber-800">Game Options</h2>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="letter-count">Letter Count: {letterCount}</Label>
                    <span className="text-sm text-amber-700">(6-10 letters)</span>
                  </div>
                  <Slider
                    id="letter-count"
                    min={6}
                    max={10}
                    step={1}
                    value={[letterCount]}
                    onValueChange={(value) => setLetterCount(value[0])}
                    className="py-4"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="round-duration">Round Duration: {roundDuration} seconds</Label>
                    <span className="text-sm text-amber-700">(30-180 seconds)</span>
                  </div>
                  <Slider
                    id="round-duration"
                    min={30}
                    max={180}
                    step={15}
                    value={[roundDuration]}
                    onValueChange={(value) => setRoundDuration(value[0])}
                    className="py-4"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold text-amber-800">Audio Settings</h2>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sound-effects" className="cursor-pointer">
                    Sound Effects
                  </Label>
                  <Switch id="sound-effects" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="background-music" className="cursor-pointer">
                    Background Music
                  </Label>
                  <Switch id="background-music" checked={musicEnabled} onCheckedChange={setMusicEnabled} />
                </div>
              </div>
            </motion.div>

            <div className="flex flex-col space-y-2">
              <Button onClick={handleSaveSettings} className="bg-amber-600 hover:bg-amber-700">
                Save Settings
              </Button>

              <Link href="/play">
                <Button variant="outline" className="w-full border-amber-600 text-amber-800">
                  Back to Game
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
