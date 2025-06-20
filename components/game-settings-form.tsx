import React from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

export interface GameSettings {
  timeLimit: number
  maxPlayers: number
  wordLength: number
}

interface GameSettingsFormProps {
  settings: GameSettings
  onChange: (settings: GameSettings) => void
  disabled?: boolean
  onSubmit?: () => void
  showSubmit?: boolean
  updating?: boolean
}

export function GameSettingsForm({
  settings,
  onChange,
  disabled = false,
  onSubmit,
  showSubmit = false,
  updating = false,
}: GameSettingsFormProps) {
  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        if (onSubmit) onSubmit()
      }}
      className="space-y-6"
    >
      <div className="score-card rounded-lg p-3 sm:p-4">
        <h2 className="text-lg sm:text-xl font-bold text-amber-100 mb-3 sm:mb-4">Game Options</h2>

        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="wordLength" className="text-sm sm:text-base text-amber-200">
                Word Length: {settings.wordLength}
              </Label>
              <span className="text-xs sm:text-sm text-amber-400">(5-10 letters)</span>
            </div>
            <Slider
              id="wordLength"
              min={5}
              max={10}
              step={1}
              value={[settings.wordLength]}
              onValueChange={(value) => onChange({ ...settings, wordLength: value[0] })}
              disabled={disabled}
              className="py-3 sm:py-4"
            />
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="timeLimit" className="text-sm sm:text-base text-amber-200">
                Time Limit: {settings.timeLimit}s
              </Label>
              <span className="text-xs sm:text-sm text-amber-400">(60-300 seconds)</span>
            </div>
            <Slider
              id="timeLimit"
              min={60}
              max={300}
              step={30}
              value={[settings.timeLimit]}
              onValueChange={(value) => onChange({ ...settings, timeLimit: value[0] })}
              disabled={disabled}
              className="py-3 sm:py-4"
            />
          </div>

          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="maxPlayers" className="text-sm sm:text-base text-amber-200">
                Max Players: {settings.maxPlayers}
              </Label>
              <span className="text-xs sm:text-sm text-amber-400">(2-8 players)</span>
            </div>
            <Slider
              id="maxPlayers"
              min={2}
              max={8}
              step={1}
              value={[settings.maxPlayers]}
              onValueChange={(value) => onChange({ ...settings, maxPlayers: value[0] })}
              disabled={disabled}
              className="py-3 sm:py-4"
            />
          </div>
        </div>
      </div>

      {showSubmit && (
        <Button 
          type="submit" 
          disabled={disabled || updating}
          className="w-full wood-button text-amber-900 font-semibold py-2 sm:py-3 text-sm sm:text-base"
        >
          {updating ? 'Updating...' : 'Update Settings'}
        </Button>
      )}
    </form>
  )
} 