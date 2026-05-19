'use client'

import { useState, useRef, useEffect } from 'react'

interface AudioPlayerProps {
  src: string
  duration?: string  // e.g. "1:24" — displayed while not yet playing
}

export function AudioPlayer({ src, duration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoadedMetadata = () => setTotalDuration(audio.duration)
    const onEnded = () => {
      setPlaying(false)
      setCurrentTime(0)
    }
    const onError = () => {
      setError(true)
      setPlaying(false)
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  const updateTime = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
    animRef.current = requestAnimationFrame(updateTime)
  }

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio || error) return

    if (playing) {
      audio.pause()
      setPlaying(false)
      cancelAnimationFrame(animRef.current)
    } else {
      setLoading(true)
      try {
        await audio.play()
        setPlaying(true)
        animRef.current = requestAnimationFrame(updateTime)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
  }

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  // Waveform bars — decorative, 20 bars
  const bars = Array.from({ length: 20 }, (_, i) => {
    const heights = [0.4, 0.6, 0.9, 0.7, 0.5, 0.8, 1.0, 0.6, 0.75, 0.45, 0.85, 0.65, 0.9, 0.7, 0.5, 0.8, 0.6, 0.95, 0.7, 0.4]
    return heights[i] ?? 0.5
  })

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-sm"
      style={{ backgroundColor: 'var(--color-green)' }}
      role="region"
      aria-label="Audio: The Possah Note"
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play / Pause button */}
      <button
        onClick={toggle}
        disabled={loading || error}
        className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-white/30 hover:border-white/70 transition-all duration-200 disabled:opacity-40"
        style={{ color: 'var(--color-bg)' }}
        aria-label={playing ? 'Pause audio' : 'Play audio'}
        aria-pressed={playing}
      >
        {loading ? (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
            <path d="M12 7a5 5 0 00-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="4" height="12" rx="1" />
            <rect x="8" y="1" width="4" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1.5l10 5.5-10 5.5V1.5z" />
          </svg>
        )}
      </button>

      {/* Text + waveform */}
      <div className="flex-1 min-w-0">
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            color: 'var(--color-bg)',
            opacity: 0.85,
            marginBottom: '6px',
          }}
        >
          Hear the founder tell you about this piece.
        </p>

        {/* Waveform */}
        <div className="flex items-end gap-[2px] h-5" aria-hidden="true">
          {bars.map((height, i) => {
            const barProgress = (i / bars.length) * 100
            const active = barProgress <= progress
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-opacity duration-150"
                style={{
                  height: `${height * 100}%`,
                  backgroundColor: active ? 'var(--color-bg)' : 'var(--color-rose)',
                  opacity: active ? 0.9 : 0.4,
                  minWidth: '2px',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Duration */}
      <span
        className="flex-shrink-0"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--color-bg)',
          opacity: 0.6,
          letterSpacing: '0.05em',
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {playing || currentTime > 0
          ? formatTime(currentTime)
          : duration ?? (totalDuration > 0 ? formatTime(totalDuration) : '--:--')}
      </span>

      {error && (
        <span
          className="sr-only"
          role="alert"
        >
          Audio unavailable
        </span>
      )}
    </div>
  )
}
