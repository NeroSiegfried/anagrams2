"use client"

import { useState } from "react"
import { Volume2, VolumeX, Music, Music2 } from "lucide-react"

interface VolumeControlsProps {
  isMuted: boolean
  setIsMuted: (muted: boolean) => void
  musicVolume: number
  setMusicVolume: (volume: number) => void
  sfxVolume: number
  setSfxVolume: (volume: number) => void
}

export function VolumeControls({
  isMuted,
  setIsMuted,
  musicVolume,
  setMusicVolume,
  sfxVolume,
  setSfxVolume,
}: VolumeControlsProps) {
  const [showControls, setShowControls] = useState(false)

  return (
    <div className="relative">
      <button
        className="text-white p-2 rounded-full hover:bg-[#004d00] transition"
        onClick={() => setShowControls(!showControls)}
      >
        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      {showControls && (
        <div className="absolute right-0 top-full mt-2 bg-[#004d00] p-4 rounded-lg shadow-lg z-10 w-64">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-white flex items-center">
                  <Music2 className="h-4 w-4 mr-2" />
                  <span>Music</span>
                </label>
                <button
                  className="text-white hover:text-gray-300"
                  onClick={() => setMusicVolume(musicVolume > 0 ? 0 : 0.5)}
                >
                  {musicVolume > 0 ? <Music2 className="h-4 w-4" /> : <Music className="h-4 w-4" />}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={musicVolume}
                onChange={(e) => setMusicVolume(Number.parseFloat(e.target.value))}
                className="w-full accent-[#C19A6B]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-white flex items-center">
                  <Volume2 className="h-4 w-4 mr-2" />
                  <span>Sound Effects</span>
                </label>
                <button
                  className="text-white hover:text-gray-300"
                  onClick={() => setSfxVolume(sfxVolume > 0 ? 0 : 0.5)}
                >
                  {sfxVolume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sfxVolume}
                onChange={(e) => setSfxVolume(Number.parseFloat(e.target.value))}
                className="w-full accent-[#C19A6B]"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white">Mute All</span>
              <button className="text-white hover:text-gray-300" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
