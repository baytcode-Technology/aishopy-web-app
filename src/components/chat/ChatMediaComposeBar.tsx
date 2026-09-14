'use client'

import type { OutboundMediaPayload } from '@/components/chat/ChatComposer'

type Props = {
  items: OutboundMediaPayload[]
  caption: string
  onChangeCaption: (value: string) => void
  onRemoveAt: (index: number) => void
  onCancel: () => void
  onSend: () => void
  onAddMore: () => void
  disabled?: boolean
}

function MediaThumb({ item }: { item: OutboundMediaPayload }) {
  if (item.type === 'video') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-800">
        <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-2 14.5v-9l8 4.5-8 4.5Z" />
        </svg>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.uri} alt="" className="h-full w-full object-cover" />
  )
}

export function ChatMediaComposeBar({
  items,
  caption,
  onChangeCaption,
  onRemoveAt,
  onCancel,
  onSend,
  onAddMore,
  disabled = false,
}: Props) {
  const countLabel = items.length === 1 ? '1 item' : `${items.length} items`

  return (
    <div className="border-t border-gray-200 bg-surface">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <button type="button" onClick={onCancel} disabled={disabled} className="p-1 text-gray-500">
          ✕
        </button>
        <p className="text-sm font-semibold text-ink">{countLabel}</p>
        <button type="button" onClick={onAddMore} disabled={disabled} className="p-1 text-brand-primary">
          +
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto px-3 pb-3">
        {items.map((item, index) => (
          <div key={`${item.uri}-${index}`} className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-200">
              <MediaThumb item={item} />
            </div>
            <button
              type="button"
              onClick={() => onRemoveAt(index)}
              disabled={disabled}
              className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/80 text-xs text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 px-3 pb-2.5">
        <textarea
          className="max-h-[100px] min-h-11 flex-1 rounded-full border border-gray-200 bg-gray-100 px-4 py-2.5 text-[15px] text-ink outline-none"
          placeholder="Add a caption"
          value={caption}
          onChange={(e) => onChangeCaption(e.target.value)}
          maxLength={1024}
          disabled={disabled}
          rows={1}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary text-brand-on-primary disabled:opacity-45"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21 23 12 2 3v7l15 2-15 2v7Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
