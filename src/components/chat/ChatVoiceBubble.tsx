'use client'

import { useAuthenticatedMediaUrl } from '@/hooks/useAuthenticatedMediaUrl'
import { useAppTheme } from '@/providers/theme-provider'
import { useChatVoicePlayer } from '@/providers/chat-voice-player-provider'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const BAR_COUNT = 28
const BAR_HEIGHTS = [6, 10, 14, 8, 16, 12, 18, 10, 14, 8, 16, 12, 20, 10, 14, 8, 12, 16, 10, 18, 8, 14, 12, 16, 10, 14, 8, 12]
const RATES = [1, 1.5, 2] as const
type PlaybackRate = (typeof RATES)[number]

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatRate(rate: number): string {
  return rate === 1 ? '1x' : `${rate}x`
}

type Props = {
  messageId: string
  uri: string
  outgoing: boolean
}

export function ChatVoiceBubble({ messageId, uri, outgoing }: Props) {
  const { isDark } = useAppTheme()
  const { requestPlay, release } = useChatVoicePlayer()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const darkOutgoing = isDark && outgoing
  const outgoingFg = darkOutgoing ? '#FFFFFF' : '#FFFFFF'
  const { src, failed } = useAuthenticatedMediaUrl(uri)
  const [loading, setLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1)
  const [positionMs, setPositionMs] = useState(0)
  const [durationMs, setDurationMs] = useState(0)

  const progress = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0
  const activeBars = useMemo(() => Math.max(1, Math.round(progress * BAR_COUNT)), [progress])

  const pauseSelf = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio
    const onTime = () => setPositionMs(audio.currentTime * 1000)
    const onMeta = () => setDurationMs(audio.duration * 1000 || 0)
    const onEnded = () => {
      setIsPlaying(false)
      setPositionMs(0)
      release(messageId)
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnded)
      release(messageId)
    }
  }, [messageId, release])

  useEffect(() => {
    if (audioRef.current && src) {
      audioRef.current.src = src
    }
  }, [src])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate
  }, [playbackRate])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !src || loading) return
    setLoading(true)
    try {
      if (isPlaying) {
        audio.pause()
        setIsPlaying(false)
        release(messageId)
        return
      }
      await requestPlay(messageId, pauseSelf)
      await audio.play()
      setIsPlaying(true)
    } finally {
      setLoading(false)
    }
  }, [isPlaying, loading, messageId, pauseSelf, release, requestPlay, src])

  const seekToRatio = (ratio: number) => {
    const audio = audioRef.current
    if (!audio || durationMs <= 0) return
    const next = Math.max(0, Math.min(durationMs, ratio * durationMs)) / 1000
    audio.currentTime = next
    setPositionMs(next * 1000)
  }

  if (failed) {
    return <p className="text-sm text-gray-500">Failed to load media</p>
  }

  return (
    <div className={`flex items-center gap-2 py-1 ${isPlaying ? 'min-w-[268px]' : 'min-w-[240px]'}`}>
      {isPlaying ? (
        <button
          type="button"
          onClick={() =>
            setPlaybackRate((prev) => RATES[(RATES.indexOf(prev) + 1) % RATES.length])
          }
          aria-label={`Playback speed ${formatRate(playbackRate)}`}
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            outgoing ? (darkOutgoing ? 'bg-white/20' : 'bg-black/20') : 'bg-gray-200'
          }`}
        >
          <span
            className={`text-[11px] font-bold ${
              outgoing ? (darkOutgoing ? 'text-white' : 'text-brand-on-primary') : 'text-ink'
            }`}
          >
            {formatRate(playbackRate)}
          </span>
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => void togglePlay()}
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          outgoing
            ? darkOutgoing
              ? 'bg-white/20'
              : 'bg-brand-on-primary/20'
            : 'bg-brand-primary/15'
        }`}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isPlaying ? (
          <span className="h-3 w-3 rounded-sm bg-current" style={{ color: outgoing ? outgoingFg : '#0a0a0b' }} />
        ) : (
          <svg
            className="ml-0.5 h-4 w-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ color: outgoing ? outgoingFg : '#0a0a0b' }}
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <button
        type="button"
        className="flex h-7 flex-1 items-end gap-[2px]"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          seekToRatio((e.clientX - rect.left) / rect.width)
        }}
      >
        {BAR_HEIGHTS.map((h, i) => (
          <span
            key={i}
            style={{ height: h, width: 3, borderRadius: 2 }}
            className={
              i < activeBars
                ? outgoing
                  ? darkOutgoing
                    ? 'bg-white'
                    : 'bg-brand-on-primary'
                  : 'bg-brand-primary'
                : outgoing
                  ? darkOutgoing
                    ? 'bg-white/45'
                    : 'bg-brand-on-primary/35'
                  : 'bg-gray-300'
            }
          />
        ))}
      </button>

      <div className="flex items-center gap-1">
        <svg
          className="h-3 w-3"
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ color: outgoing ? outgoingFg : '#71717a' }}
        >
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2Z" />
        </svg>
        <span
          className={`min-w-[36px] text-xs tabular-nums ${
            outgoing
              ? darkOutgoing
                ? 'text-white/90'
                : 'text-brand-on-primary/90'
              : 'text-gray-500'
          }`}
        >
          {durationMs > 0 ? formatMs(isPlaying ? positionMs : durationMs) : '0:00'}
        </span>
      </div>
    </div>
  )
}
