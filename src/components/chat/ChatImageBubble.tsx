'use client'

import { useAuthenticatedMediaUrl } from '@/hooks/useAuthenticatedMediaUrl'

type Props = {
  uri: string
  variant: 'image' | 'sticker'
  onPress?: () => void
  onLongPress?: () => void
}

export function ChatImageBubble({ uri, variant, onPress, onLongPress }: Props) {
  const { src, failed } = useAuthenticatedMediaUrl(uri)
  const sizeClass = variant === 'sticker' ? 'h-32 w-32' : 'h-56 w-56'

  if (failed) {
    return (
      <div className={`${sizeClass} flex items-center justify-center rounded-xl bg-gray-100`}>
        <p className="px-3 text-center text-sm text-gray-500">Failed to load media</p>
      </div>
    )
  }

  if (!src) {
    return <div className={`${sizeClass} animate-pulse rounded-xl bg-gray-100`} />
  }

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`${sizeClass} rounded-xl bg-gray-100 object-cover ${
        variant === 'sticker' ? 'object-contain' : ''
      }`}
    />
  )

  if (variant === 'sticker' || (!onPress && !onLongPress)) return image

  return (
    <button
      type="button"
      onClick={onPress}
      onContextMenu={(e) => {
        if (!onLongPress) return
        e.preventDefault()
        onLongPress()
      }}
    >
      {image}
    </button>
  )
}
