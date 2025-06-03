"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useGame } from "@/lib/game-context"
import { useToast } from "@/components/ui/use-toast"
import { Settings, Volume2, Music } from "lucide-react"
import { Navbar } from "@/components/navbar"

export function GameSettings() {
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
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center p-4 pt-20 casino-table">
        <div className="w-full max-w-md mx-auto game-card border-4 border-amber-600 rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-center mb-6">
            <Settings className="h-8 w-8 text-amber-300 mr-2" />
            <h1 className="text-3xl font-bold text-amber-100">Game Settings</h1>
          </div>

          <div className="space-y-8">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="score-card rounded-lg p-4">
                <h2 className="text-xl font-bold text-amber-100 mb-4">Game Options</h2>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="letter-count" className="text-amber-200">
                        Letter Count: {letterCount}
                      </Label>
                      <span className="text-sm text-amber-400">(6-10 letters)</span>
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

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="round-duration" className="text-amber-200">
                        Round Duration: {roundDuration}s
                      </Label>
                      <span className="text-sm text-amber-400">(30-180 seconds)</span>
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
              </div>

              <div className="score-card rounded-lg p-4">
                <h2 className="text-xl font-bold text-amber-100 mb-4">Audio Settings</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound-effects" className="cursor-pointer text-amber-200 flex items-center">
                      <Volume2 className="h-4 w-4 mr-2 text-amber-300" />
                      Sound Effects
                    </Label>
                    <Switch id="sound-effects" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="background-music" className="cursor-pointer text-amber-200 flex items-center">
                      <Music className="h-4 w-4 mr-2 text-amber-300" />
                      Background Music
                    </Label>
                    <Switch id="background-music" checked={musicEnabled} onCheckedChange={setMusicEnabled} />
                  </div>
                </div>
              </div>
            </motion.div>

            <Button onClick={handleSaveSettings} className="w-full wood-button text-amber-900 font-semibold py-3">
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
