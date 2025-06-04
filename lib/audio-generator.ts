// Generate dummy audio files using Web Audio API
export class AudioGenerator {
  private audioContext: AudioContext | null = null
  private isInitialized = false

  constructor() {
    // Don't initialize immediately to avoid issues
  }

  private async initializeAudio() {
    if (this.isInitialized || typeof window === "undefined") return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Resume audio context if it's suspended (required by some browsers)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      this.isInitialized = true
    } catch (error) {
      console.warn("Audio initialization failed:", error)
      this.audioContext = null
      this.isInitialized = false
    }
  }

  // Simple beep sound without external files
  async playSimpleBeep(frequency = 440, duration = 0.2, volume = 0.3) {
    try {
      await this.initializeAudio()

      if (!this.audioContext) return

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration)
    } catch (error) {
      // Silently fail - don't log audio errors to avoid spam
    }
  }

  // Play different types of sounds
  async playCorrectSound() {
    await this.playSimpleBeep(523.25, 0.3, 0.3) // C5
  }

  async playIncorrectSound() {
    await this.playSimpleBeep(220, 0.5, 0.3) // A3
  }

  async playBonusSound() {
    await this.playSimpleBeep(783.99, 0.6, 0.3) // G5
  }
}
