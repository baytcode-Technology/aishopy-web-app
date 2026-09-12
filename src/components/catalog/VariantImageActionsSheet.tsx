'use client'

type Props = {
  open: boolean
  onClose: () => void
  onView: () => void
  onReplace: () => void
  onRemove: () => void
}

export function VariantImageActionsSheet({ open, onClose, onView, onReplace, onRemove }: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-5 pb-6 lg:items-center lg:pb-0">
      <button type="button" aria-label="Close actions" className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-surface px-5 py-4 shadow-lg">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-ink">Actions</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500"
          >
            ✕
          </button>
        </div>
        <ActionRow
          label="View media"
          onClick={() => {
            onClose()
            onView()
          }}
        />
        <ActionRow
          label="Replace media"
          color="#16A34A"
          onClick={() => {
            onClose()
            onReplace()
          }}
        />
        <ActionRow
          label="Remove media"
          color="#EF4444"
          onClick={() => {
            onClose()
            onRemove()
          }}
        />
      </div>
    </div>
  )
}

function ActionRow({
  label,
  color,
  onClick,
}: {
  label: string
  color?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center py-3 text-left text-[15px] font-medium text-ink"
      style={color ? { color } : undefined}
    >
      {label}
    </button>
  )
}
