'use client'

import { useAuthenticatedMediaUrl } from '@/hooks/useAuthenticatedMediaUrl'

type Props = {
  uri: string
  onPress: () => void
  onLongPress?: () => void
}

export function ChatVideoBubble({ uri, onPress, onLongPress }: Props) {
  const { src } = useAuthenticatedMediaUrl(uri)

  return (
    <button
      type="button"
      onClick={onPress}
      onContextMenu={(e) => {
        if (!onLongPress) return
        e.preventDefault()
        onLongPress()
      }}
      className="relative h-40 w-56 overflow-hidden rounded-xl bg-gray-900"
    >
      {src ? (
        <video src={src} muted className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full animate-pulse bg-gray-800" />
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
        <svg className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-2 14.5v-9l8 4.5-8 4.5Z" />
        </svg>
      </span>
      <span className="absolute bottom-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
        Video
      </span>
    </button>
  )
}
