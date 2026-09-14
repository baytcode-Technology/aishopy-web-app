'use client'

import { useAuthenticatedMediaUrl } from '@/hooks/useAuthenticatedMediaUrl'

type Props = {
  visible: boolean
  mode: 'image' | 'video' | null
  uri: string | null
  onClose: () => void
}

export function ChatMediaViewerModal({ visible, mode, uri, onClose }: Props) {
  const { src, failed } = useAuthenticatedMediaUrl(visible ? uri : null)

  if (!visible || !mode || !uri) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <button
        type="button"
        onClick={onClose}
        className="m-4 self-start rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white"
      >
        Close
      </button>
      <div className="flex flex-1 items-center justify-center px-2">
        {failed ? (
          <p className="px-6 text-center text-white/80">Failed to load media</p>
        ) : !src ? (
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : mode === 'image' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="max-h-[80vh] max-w-full object-contain" />
        ) : (
          <video src={src} controls autoPlay className="max-h-[80vh] max-w-full" />
        )}
      </div>
    </div>
  )
}
