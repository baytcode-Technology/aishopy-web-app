'use client'

import { BubbleMeta } from '@/components/chat/BubbleMeta'
import { ChatImageBubble } from '@/components/chat/ChatImageBubble'
import { ChatMediaViewerModal } from '@/components/chat/ChatMediaViewerModal'
import { ChatVideoBubble } from '@/components/chat/ChatVideoBubble'
import { ChatVoiceBubble } from '@/components/chat/ChatVoiceBubble'
import { FormattedMessageText } from '@/core/lib/parse-inline-markdown'
import { mediaUrlRequiresAuth, resolveAuthenticatedMediaUrl } from '@/core/lib/whatsapp-media'
import type { ChatMessage } from '@/core/types/chat'
import { useAppTheme } from '@/providers/theme-provider'
import { useState } from 'react'

type Props = {
  message: ChatMessage
  storeId?: number
  onLongPress?: (message: ChatMessage) => void
  onForward?: (message: ChatMessage) => void
}

function WhatsAppDocumentBubble({ uri, label }: { uri: string; label: string }) {
  const openDocument = async () => {
    try {
      const href = mediaUrlRequiresAuth(uri) ? await resolveAuthenticatedMediaUrl(uri) : uri
      window.open(href, '_blank', 'noopener,noreferrer')
    } catch {
      // Keep thread usable if the document URL is stale.
    }
  }

  return (
    <button type="button" className="flex min-w-[200px] items-center gap-3 text-left" onClick={() => void openDocument()}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/15">
        <svg className="h-4 w-4 text-brand-primary" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2h8l6 6v14H6V2Zm8 1.5V9h5.5L14 3.5ZM8 12h8v2H8v-2Zm0 4h8v2H8v-2Z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[15px] font-medium text-ink">{label}</p>
        <p className="mt-0.5 text-xs text-gray-500">Tap to open</p>
      </div>
    </button>
  )
}

function TextBubbleContent({
  message,
  outgoing,
  isDark,
}: {
  message: ChatMessage
  outgoing: boolean
  isDark: boolean
}) {
  if (outgoing) {
    return (
      <p className={`text-[15px] leading-[21px] ${isDark ? 'text-white' : 'text-brand-on-primary'}`}>
        {message.text}
      </p>
    )
  }

  return <FormattedMessageText text={message.text} className="text-[15px] leading-[21px] text-ink" />
}

function ReactionBadge({ reactions, outgoing }: { reactions: string[]; outgoing: boolean }) {
  return (
    <div className={`absolute -bottom-3 z-10 ${outgoing ? 'right-3' : 'left-3'}`}>
      <div className="min-w-[28px] rounded-full border border-gray-200 bg-surface px-2 py-0.5 text-center shadow-sm">
        <span className="text-[15px] leading-[18px]">{reactions.join('')}</span>
      </div>
    </div>
  )
}

function ForwardIconButton({ onPress }: { onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label="Forward message"
      className="mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="m13 5 7 7-7 7v-4H4v-6h9V5Z" />
      </svg>
    </button>
  )
}

export function MessageBubble({ message, storeId, onLongPress, onForward }: Props) {
  const outgoing = message.outgoing
  const type = message.type ?? 'text'
  const mediaUrl = message.mediaUrl
  const showMedia = Boolean(mediaUrl && storeId)
  const { isDark } = useAppTheme()
  const isMediaMessage =
    showMedia && ['image', 'sticker', 'video', 'audio', 'document'].includes(type)
  const hasReactions = Boolean(message.reactions?.length)
  const showForwardIcon = Boolean(onForward && ['image', 'sticker', 'video'].includes(type))
  const [viewerMode, setViewerMode] = useState<'image' | 'video' | null>(null)

  const handleLongPress = () => onLongPress?.(message)
  const handleForward = () => onForward?.(message)

  const bubbleBody = (
    <div className="relative">
      <div
        className={`overflow-hidden rounded-2xl ${isMediaMessage ? 'p-1' : 'px-3.5 py-2.5'} ${
          outgoing
            ? isDark
              ? 'bg-brand-green'
              : 'bg-brand-primary'
            : 'border border-gray-200 bg-surface'
        }`}
      >
        {showMedia && (type === 'image' || type === 'sticker') ? (
          <div>
            <ChatImageBubble
              uri={mediaUrl!}
              variant={type === 'sticker' ? 'sticker' : 'image'}
              onPress={type === 'image' ? () => setViewerMode('image') : undefined}
              onLongPress={handleLongPress}
            />
            {message.caption ? (
              <div className="px-2.5 pb-1 pt-1.5">
                {outgoing ? (
                  <p
                    className={`text-[15px] leading-[21px] ${
                      isDark ? 'text-white' : 'text-brand-on-primary'
                    }`}
                  >
                    {message.caption}
                  </p>
                ) : (
                  <FormattedMessageText
                    text={message.caption}
                    className="text-[15px] leading-[21px] text-ink"
                  />
                )}
              </div>
            ) : null}
            <div className="px-2.5 pb-1">
              <BubbleMeta message={message} outgoing={outgoing} overlay={type === 'image'} />
            </div>
          </div>
        ) : showMedia && type === 'video' ? (
          <>
            <ChatVideoBubble
              uri={mediaUrl!}
              onPress={() => setViewerMode('video')}
              onLongPress={handleLongPress}
            />
            {message.caption ? (
              <div className="px-2.5 pt-1">
                <FormattedMessageText
                  text={message.caption}
                  className={`text-[15px] leading-[21px] ${
                    outgoing ? (isDark ? 'text-white' : 'text-brand-on-primary') : 'text-ink'
                  }`}
                />
              </div>
            ) : null}
            <div className="px-2.5 pb-1">
              <BubbleMeta message={message} outgoing={outgoing} />
            </div>
          </>
        ) : showMedia && type === 'audio' ? (
          <>
            <div className="px-2.5 pt-1.5">
              <ChatVoiceBubble
                messageId={String(message.clientKey ?? message.id)}
                uri={mediaUrl!}
                outgoing={outgoing}
              />
            </div>
            <div className="px-2.5 pb-1">
              <BubbleMeta message={message} outgoing={outgoing} />
            </div>
          </>
        ) : showMedia && type === 'document' ? (
          <>
            <div className="px-2.5 pt-1.5">
              <WhatsAppDocumentBubble uri={mediaUrl!} label={message.caption || message.text} />
            </div>
            <div className="px-2.5 pb-1">
              <BubbleMeta message={message} outgoing={outgoing} />
            </div>
          </>
        ) : (
          <>
            <TextBubbleContent message={message} outgoing={outgoing} isDark={isDark} />
            <BubbleMeta message={message} outgoing={outgoing} />
          </>
        )}
      </div>
      {hasReactions ? <ReactionBadge reactions={message.reactions!} outgoing={outgoing} /> : null}
    </div>
  )

  return (
    <>
      {showForwardIcon ? (
        <div
          className={`max-w-[88%] ${hasReactions ? 'mb-5' : 'mb-3'} ${
            outgoing ? 'self-end' : 'self-start'
          }`}
        >
          <div className={`flex items-end gap-2 ${outgoing ? 'justify-end' : 'justify-start'}`}>
            {outgoing ? <ForwardIconButton onPress={handleForward} /> : null}
            <div className="max-w-[82%] shrink">{bubbleBody}</div>
            {!outgoing ? <ForwardIconButton onPress={handleForward} /> : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`max-w-[82%] text-left ${hasReactions ? 'mb-5' : 'mb-3'} ${
            outgoing ? 'self-end' : 'self-start'
          }`}
          onContextMenu={(e) => {
            e.preventDefault()
            handleLongPress()
          }}
        >
          {bubbleBody}
        </button>
      )}

      <ChatMediaViewerModal
        visible={viewerMode !== null}
        mode={viewerMode}
        uri={mediaUrl ?? null}
        onClose={() => setViewerMode(null)}
      />
    </>
  )
}
