'use client'

import { ChatAttachSheet } from '@/components/chat/ChatAttachSheet'
import { ChatMediaComposeBar } from '@/components/chat/ChatMediaComposeBar'
import { getErrorMessage } from '@/core/lib/api-error'
import type { ChatChannel } from '@/core/types/chat'
import { useChatVoiceRecording } from '@/providers/chat-voice-recording-provider'
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
  const {
    session,
    startRecording,
    resumeRecording,
    cancelRecording,
    finishRecording,
  } = useChatVoiceRecording()
  const [busy, setBusy] = useState(false)
  const [attachOpen, setAttachOpen] = useState(false)
  const [pendingMedia, setPendingMedia] = useState<OutboundMediaPayload[]>([])
  const [mediaCaption, setMediaCaption] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const activeSession = session?.conversationId === conversationId ? session : null
  const supportsRichComposer = channel === 'whatsapp' || channel === 'instagram'

  useEffect(() => {
    return () => {
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

  const handleStartRecording = async () => {
    if (disabled || busy || !supportsRichComposer) return
    try {
      await startRecording(conversationId)
    } catch (e: unknown) {
      onError?.(getErrorMessage(e, 'Could not start recording'))
    }
  }

  const handleCancelRecording = async () => {
    await cancelRecording(conversationId)
  }

  const handleResumeRecording = async () => {
    try {
      await resumeRecording(conversationId)
    } catch (e: unknown) {
      onError?.(getErrorMessage(e, 'Could not resume recording'))
    }
  }

  const handleFinishRecording = async () => {
    setBusy(true)
    try {
      const file = await finishRecording(conversationId)
      if (!file) throw new Error('Recording file missing')
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

  if (activeSession?.status === 'recording') {
    return (
      <div className="gap-2 border-t border-gray-200 bg-surface px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="font-semibold tabular-nums text-red-600">
              {formatRecordingTime(activeSession.seconds)}
            </span>
          </div>
          <p className="text-sm text-gray-500">Recording voice message</p>
        </div>
        <div className="mt-2 flex items-center justify-end gap-3">
          <button type="button" onClick={() => void handleCancelRecording()} className="px-3 py-2 font-semibold text-gray-600">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleFinishRecording()}
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

  if (activeSession?.status === 'paused') {
    return (
      <div className="gap-2 border-t border-gray-200 bg-surface px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="font-semibold tabular-nums text-amber-700">
              {formatRecordingTime(activeSession.seconds)}
            </span>
          </div>
          <p className="text-sm text-gray-500">Voice message paused</p>
        </div>
        <div className="mt-2 flex items-center justify-end gap-3">
          <button type="button" onClick={() => void handleCancelRecording()} className="px-3 py-2 font-semibold text-gray-600">
            Cancel
          </button>
          <button type="button" onClick={() => void handleResumeRecording()} className="px-3 py-2 font-semibold text-brand-primary">
            Resume
          </button>
          <button
            type="button"
            onClick={() => void handleFinishRecording()}
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
              onClick={() => void handleStartRecording()}
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
