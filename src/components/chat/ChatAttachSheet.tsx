'use client'

type Props = {
  visible: boolean
  onClose: () => void
  onPickPhoto: () => void
  onPickVideo: () => void
  onOpenCamera: () => void
}

function AttachTile({
  label,
  backgroundColor,
  onPress,
  icon,
}: {
  label: string
  backgroundColor: string
  onPress: () => void
  icon: 'photo' | 'video' | 'camera'
}) {
  return (
    <button type="button" onClick={onPress} aria-label={label} className="flex flex-1 flex-col items-center gap-2 py-3">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full text-white"
        style={{ backgroundColor }}
      >
        {icon === 'photo' ? (
          <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM8.5 13.5 11 16.5l3.5-4.5 4.5 6H5l3.5-4.5Z" />
          </svg>
        ) : icon === 'video' ? (
          <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 10.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5l5 4v-11l-5 4Z" />
          </svg>
        ) : (
          <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4ZM9 3 7.2 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Z" />
          </svg>
        )}
      </span>
      <span className="text-center text-sm font-medium text-ink">{label}</span>
    </button>
  )
}

export function ChatAttachSheet({
  visible,
  onClose,
  onPickPhoto,
  onPickVideo,
  onOpenCamera,
}: Props) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="w-full rounded-t-2xl bg-surface px-4 pb-8 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />
        <p className="text-lg font-bold text-ink">Send media</p>
        <p className="mb-4 mt-1 text-sm text-gray-500">
          Choose photos, videos, or open the camera
        </p>
        <div className="flex gap-2 px-1 py-2">
          <AttachTile label="Photo" icon="photo" backgroundColor="#25D366" onPress={onPickPhoto} />
          <AttachTile label="Video" icon="video" backgroundColor="#7C3AED" onPress={onPickVideo} />
          <AttachTile label="Camera" icon="camera" backgroundColor="#2563EB" onPress={onOpenCamera} />
        </div>
        <button type="button" className="mt-3 w-full border-t border-gray-100 py-3 text-base font-medium text-gray-500" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
