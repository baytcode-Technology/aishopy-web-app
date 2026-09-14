'use client'

import { ChatAttachSheet } from '@/components/chat/ChatAttachSheet'
import { ChatMediaComposeBar } from '@/components/chat/ChatMediaComposeBar'
import { getErrorMessage } from '@/core/lib/api-error'
import type { ChatChannel } from '@/core/types/chat'
import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_MEDIA_SELECTION = 10

export type OutboundMediaPayload = {
  type: 'image' | 'audio' | 'video'
  uri: string
  file: File
  name: string
  mimeType: string
  voice?: boolean
  caption?: string
}

type VoiceSession = {
  status: 'recording' | 'paused'
  seconds: number
}

type Props = {
  conversationId: number
  draft: string
  onChangeDraft: (value: string) => void
  onSendText: () => void
  onSendMedia: (payload: OutboundMediaPayload | OutboundMediaPayload[]) => Promise<void>
  onOpenProductPicker?: () => void
  disabled?: boolean
  channel: ChatChannel
  onError?: (message: string) => void
}

function formatRecordingTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function fileToPayload(file: File, index: number): OutboundMediaPayload {
  const isVideo = file.type.startsWith('video/')
  const isAudio = file.type.startsWith('audio/')
  const type = isAudio ? 'audio' : isVideo ? 'video' : 'image'
  return {
    type,
    uri: URL.createObjectURL(file),
    file,
    name: file.name || `${type}-${Date.now()}-${index}`,
    mimeType: file.type || (isVideo ? 'video/mp4' : isAudio ? 'audio/webm' : 'image/jpeg'),
  }
}

function mergePendingMedia(
  current: OutboundMediaPayload[],
  incoming: OutboundMediaPayload[],
): OutboundMediaPayload[] {
  return [...current, ...incoming].slice(0, MAX_MEDIA_SELECTION)
}

export function ChatComposer({
  conversationId,
  draft,
  onChangeDraft,
  onSendText,
  onSendMedia,
  onOpenProductPicker,
  disabled = false,
  channel,
  onError,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [attachOpen, setAttachOpen] = useState(false)
  const [pendingMedia, setPendingMedia] = useState<OutboundMediaPayload[]>([])
  const [mediaCaption, setMediaCaption] = useState('')
  const [voice, setVoice] = useState<VoiceSession | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const supportsRichComposer = channel === 'whatsapp' || channel === 'instagram'

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
  }

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  useEffect(() => {
    return () => {
      clearTick()
      stopStream()
      pendingMedia.forEach((item) => URL.revokeObjectURL(item.uri))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  const stageFiles = (files: FileList | null) => {
    if (!files?.length) return
    const remaining = MAX_MEDIA_SELECTION - pendingMedia.length
    if (remaining <= 0) {
      onError?.(`You can send up to ${MAX_MEDIA_SELECTION} items at a time`)
      return
    }
    const payloads = Array.from(files)
      .slice(0, remaining)
      .map((file, index) => fileToPayload(file, index))
    setPendingMedia((current) => mergePendingMedia(current, payloads))
  }

  const clearPendingMedia = useCallback(() => {
    setPendingMedia((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.uri))
      return []
    })
    setMediaCaption('')
  }, [])

  const sendPendingMedia = async () => {
    if (!pendingMedia.length || disabled || busy) return
    const caption = mediaCaption.trim()
    const payloads = pendingMedia.map((item, index) => ({
      ...item,
      caption: caption && index === pendingMedia.length - 1 ? caption : undefined,
    }))
    clearPendingMedia()
    setBusy(true)
    try {
      await onSendMedia(payloads.length === 1 ? payloads[0] : payloads)
    } catch (e: unknown) {
      onError?.(getErrorMessage(e, 'Failed to send media'))
      setPendingMedia(payloads)
      setMediaCaption(caption)
    } finally {
      setBusy(false)
    }
  }

  const startRecording = async () => {
    if (disabled || busy || !supportsRichComposer) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.start()
      recorderRef.current = recorder
      setVoice({ status: 'recording', seconds: 0 })
      tickRef.current = setInterval(() => {
        setVoice((current) =>
          current?.status === 'recording' ? { ...current, seconds: current.seconds + 1 } : current,
        )
      }, 1000)
    } catch (e: unknown) {
      onError?.(getErrorMessage(e, 'Could not start recording'))
    }
  }

  const cancelRecording = () => {
    clearTick()
    recorderRef.current?.stop()
    recorderRef.current = null
    chunksRef.current = []
    stopStream()
    setVoice(null)
  }

  const resumeRecording = () => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume()
      setVoice((current) => (current ? { ...current, status: 'recording' } : current))
      tickRef.current = setInterval(() => {
        setVoice((current) =>
          current?.status === 'recording' ? { ...current, seconds: current.seconds + 1 } : current,
        )
      }, 1000)
    }
  }

  const finishRecording = async () => {
    const recorder = recorderRef.current
    if (!recorder) return
    setBusy(true)
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          resolve(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }))
        }
        recorder.onerror = () => reject(new Error('Recording file missing'))
        if (recorder.state !== 'inactive') recorder.stop()
        else resolve(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }))
      })
      clearTick()
      stopStream()
      recorderRef.current = null
      setVoice(null)
      if (!blob.size) throw new Error('Recording file missing')
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || 'audio/webm' })
      await onSendMedia({
        type: 'audio',
        uri: URL.createObjectURL(file),
        file,
        name: file.name,
        mimeType: file.type,
        voice: false,
      })
    } catch (e: unknown) {
      onError?.(getErrorMessage(e, 'Failed to send voice message'))
    } finally {
      setBusy(false)
    }
  }

  if (voice?.status === 'recording') {
    return (
      <div className="gap-2 border-t border-gray-200 bg-surface px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="font-semibold tabular-nums text-red-600">
              {formatRecordingTime(voice.seconds)}
            </span>
          </div>
          <p className="text-sm text-gray-500">Recording voice message</p>
        </div>
        <div className="mt-2 flex items-center justify-end gap-3">
          <button type="button" onClick={cancelRecording} className="px-3 py-2 font-semibold text-gray-600">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void finishRecording()}
            disabled={busy}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary text-brand-on-primary"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 21 23 12 2 3v7l15 2-15 2v7Z" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  if (voice?.status === 'paused') {
    return (
      <div className="gap-2 border-t border-gray-200 bg-surface px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="font-semibold tabular-nums text-amber-700">
              {formatRecordingTime(voice.seconds)}
            </span>
          </div>
          <p className="text-sm text-gray-500">Voice message paused</p>
        </div>
        <div className="mt-2 flex items-center justify-end gap-3">
          <button type="button" onClick={cancelRecording} className="px-3 py-2 font-semibold text-gray-600">
            Cancel
          </button>
          <button type="button" onClick={resumeRecording} className="px-3 py-2 font-semibold text-brand-primary">
            Resume
          </button>
          <button
            type="button"
            onClick={() => void finishRecording()}
            disabled={busy}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary text-brand-on-primary"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 21 23 12 2 3v7l15 2-15 2v7Z" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  if (pendingMedia.length > 0) {
    return (
      <>
        <ChatMediaComposeBar
          items={pendingMedia}
          caption={mediaCaption}
          onChangeCaption={setMediaCaption}
          onRemoveAt={(index) => {
            setPendingMedia((current) => {
              const next = current.filter((_, i) => i !== index)
              URL.revokeObjectURL(current[index].uri)
              return next
            })
          }}
          onCancel={clearPendingMedia}
          onSend={() => void sendPendingMedia()}
          onAddMore={() => setAttachOpen(true)}
          disabled={disabled || busy}
        />
        <ChatAttachSheet
          visible={attachOpen}
          onClose={() => setAttachOpen(false)}
          onPickPhoto={() => {
            setAttachOpen(false)
            photoInputRef.current?.click()
          }}
          onPickVideo={() => {
            setAttachOpen(false)
            videoInputRef.current?.click()
          }}
          onOpenCamera={() => {
            setAttachOpen(false)
            cameraInputRef.current?.click()
          }}
        />
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            stageFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            stageFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            stageFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex items-end gap-2 px-3 py-2.5">
        {supportsRichComposer ? (
          <>
            <button
              type="button"
              onClick={() => setAttachOpen(true)}
              disabled={disabled || busy}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-brand-primary disabled:opacity-45"
            >
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 6.5 7.4 15.6a2.5 2.5 0 1 0 3.5 3.5l10.3-10.3a4.5 4.5 0 0 0-6.4-6.4L4.5 12.8a6.5 6.5 0 0 0 9.2 9.2l8.1-8.1" />
              </svg>
            </button>
            {onOpenProductPicker ? (
              <button
                type="button"
                onClick={onOpenProductPicker}
                disabled={disabled || busy}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-brand-primary disabled:opacity-45"
              >
                <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 7V6a6 6 0 1 1 12 0v1h2a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1h2Zm2 0h8V6a4 4 0 1 0-8 0v1Z" />
                </svg>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void startRecording()}
              disabled={disabled || busy}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-brand-primary disabled:opacity-45"
            >
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2Z" />
              </svg>
            </button>
          </>
        ) : null}

        <textarea
          className="max-h-[100px] min-h-11 flex-1 rounded-full border border-gray-200 bg-gray-100 px-4 py-2.5 text-[15px] text-ink outline-none"
          placeholder="Type a message"
          value={draft}
          onChange={(e) => onChangeDraft(e.target.value)}
          maxLength={2000}
          disabled={disabled || busy}
          rows={1}
        />

        <button
          type="button"
          onClick={onSendText}
          disabled={disabled || busy}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary text-brand-on-primary disabled:opacity-45"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21 23 12 2 3v7l15 2-15 2v7Z" />
          </svg>
        </button>
      </div>

      <ChatAttachSheet
        visible={attachOpen}
        onClose={() => setAttachOpen(false)}
        onPickPhoto={() => {
          setAttachOpen(false)
          photoInputRef.current?.click()
        }}
        onPickVideo={() => {
          setAttachOpen(false)
          videoInputRef.current?.click()
        }}
        onOpenCamera={() => {
          setAttachOpen(false)
          cameraInputRef.current?.click()
        }}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          stageFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          stageFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          stageFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </>
  )
}
