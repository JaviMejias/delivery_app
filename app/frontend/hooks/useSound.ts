import { useCallback, useRef } from 'react'

type SoundType = 'beep' | 'pop' | 'success' | 'error' | 'kaching' | 'radar'

export function useSound() {
  const audioCtxRef = useRef<AudioContext | null>(null)

  const getContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  const playSound = useCallback((type: SoundType) => {
    try {
      const ctx = getContext()
      const t = ctx.currentTime

      const playOscillator = (freq: number, type: OscillatorType, startTime: number, duration: number, vol = 0.1) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        
        osc.type = type
        osc.frequency.setValueAtTime(freq, startTime)
        
        gain.gain.setValueAtTime(vol, startTime)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
        
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.start(startTime)
        osc.stop(startTime + duration)
      }

      switch (type) {
        case 'beep':
          // Short high pitch for adding items
          playOscillator(800, 'sine', t, 0.1, 0.1)
          break
        case 'pop':
          // Very short, low click for changing quantity
          playOscillator(400, 'triangle', t, 0.05, 0.05)
          break
        case 'success':
        case 'kaching':
          // Ascending notes for checkout success
          playOscillator(523.25, 'sine', t, 0.1, 0.1) // C5
          playOscillator(659.25, 'sine', t + 0.1, 0.2, 0.1) // E5
          playOscillator(783.99, 'sine', t + 0.2, 0.4, 0.1) // G5
          break
        case 'error':
          // Low buzz for error/invalid
          playOscillator(150, 'sawtooth', t, 0.3, 0.1)
          playOscillator(140, 'sawtooth', t + 0.1, 0.3, 0.1)
          break
        case 'radar':
          // Urgent alarm sound for new orders
          playOscillator(880, 'sine', t, 0.15, 0.3)
          playOscillator(1108.73, 'sine', t + 0.15, 0.3, 0.3)
          playOscillator(880, 'sine', t + 0.6, 0.15, 0.3)
          playOscillator(1108.73, 'sine', t + 0.75, 0.3, 0.3)
          playOscillator(880, 'sine', t + 1.2, 0.15, 0.3)
          playOscillator(1108.73, 'sine', t + 1.35, 0.5, 0.3)
          break
      }
    } catch (e) {
      console.warn('Audio playback failed', e)
    }
  }, [])

  return { playSound }
}
