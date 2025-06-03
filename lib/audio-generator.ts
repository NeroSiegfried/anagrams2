// Generate dummy audio files using Web Audio API
export class AudioGenerator {
  private audioContext: AudioContext | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  private createTone(frequency: number, duration: number, type: OscillatorType = "sine"): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const numSamples = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate)
    const channelData = buffer.getChannelData(0)

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate
      let sample = 0

      switch (type) {
        case "sine":
          sample = Math.sin(2 * Math.PI * frequency * t)
          break
        case "square":
          sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1
          break
        case "triangle":
          sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t))
          break
        case "sawtooth":
          sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5))
          break
      }

      // Apply envelope (fade in/out)
      const envelope = Math.min(t * 10, (duration - t) * 10, 1)
      channelData[i] = sample * envelope * 0.3 // Reduce volume
    }

    return buffer
  }

  generateCorrectSound(): AudioBuffer | null {
    // Pleasant ascending chord
    return this.createTone(523.25, 0.3, "sine") // C5
  }

  generateIncorrectSound(): AudioBuffer | null {
    // Lower, more dissonant tone
    return this.createTone(220, 0.5, "square") // A3
  }

  generateBonusSound(): AudioBuffer | null {
    // Higher, more exciting tone
    return this.createTone(783.99, 0.6, "triangle") // G5
  }

  playBuffer(buffer: AudioBuffer | null, volume = 0.3) {
    if (!this.audioContext || !buffer) return

    const source = this.audioContext.createBufferSource()
    const gainNode = this.audioContext.createGain()

    source.buffer = buffer
    gainNode.gain.value = volume

    source.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    source.start()
  }

  generateBackgroundMusic(): AudioBuffer | null {
    if (!this.audioContext) return null

    const duration = 10 // 10 seconds loop
    const sampleRate = this.audioContext.sampleRate
    const numSamples = duration * sampleRate
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate)
    const channelData = buffer.getChannelData(0)

    // Simple ambient background music
    const frequencies = [261.63, 329.63, 392.0, 523.25] // C major chord

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate
      let sample = 0

      // Layer multiple sine waves for a richer sound
      frequencies.forEach((freq, index) => {
        const phase = (index + 1) * 0.1
        sample += Math.sin(2 * Math.PI * freq * t + phase) * (0.1 / frequencies.length)
      })

      // Add some gentle modulation
      sample *= 1 + 0.2 * Math.sin(2 * Math.PI * 0.5 * t)

      // Apply gentle envelope
      const envelope = 0.5 + 0.5 * Math.sin((2 * Math.PI * t) / duration)
      channelData[i] = sample * envelope * 0.1 // Very quiet background
    }

    return buffer
  }
}
