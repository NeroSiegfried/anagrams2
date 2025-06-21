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

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
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

    onClose()
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="game-card border-0 sm:border-4 border-amber-600 rounded-none sm:rounded-xl shadow-none sm:shadow-2xl p-6 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center mb-6">
          <Settings className="h-8 w-8 text-amber-300 mr-2" />
          <h2 className="text-2xl font-bold text-amber-100">Game Settings</h2>
        </div>

        <div className="space-y-6">
          <div className="score-card rounded-lg p-4">
            <h3 className="text-xl font-bold text-amber-100 mb-4">Game Options</h3>

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
            <h3 className="text-xl font-bold text-amber-100 mb-4">Audio Settings</h3>

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

          <div className="flex space-x-3">
            <Button onClick={handleSaveSettings} className="flex-1 wood-button text-amber-900 font-semibold py-3">
              Save
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-amber-300 bg-amber-900/20 text-amber-100 hover:bg-amber-600 hover:text-amber-900"
            >
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
