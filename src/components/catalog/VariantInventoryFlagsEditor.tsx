type Props = {
  markAsSold: boolean
  markAsNonInventory: boolean
  onMarkAsSoldChange: (value: boolean) => void
  onMarkAsNonInventoryChange: (value: boolean) => void
  disabled?: boolean
}

export function VariantInventoryFlagsEditor({
  markAsSold,
  markAsNonInventory,
  onMarkAsSoldChange,
  onMarkAsNonInventoryChange,
  disabled,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
        <span>
          <span className="block text-[13px] font-semibold text-ink">Mark as sold</span>
          <span className="mt-0.5 block text-[11px] leading-4 text-gray-500">
            This variant only — shows 0 stock. Offline orders still allowed.
          </span>
        </span>
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={markAsSold}
          disabled={disabled}
          onChange={(e) => {
            const value = e.target.checked
            onMarkAsSoldChange(value)
            if (value) onMarkAsNonInventoryChange(false)
          }}
        />
      </label>
      <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
        <span>
          <span className="block text-[13px] font-semibold text-ink">Mark as non-inventory</span>
          <span className="mt-0.5 block text-[11px] leading-4 text-gray-500">
            This variant only — unlimited orders, no stock updates.
          </span>
        </span>
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={markAsNonInventory}
          disabled={disabled}
          onChange={(e) => {
            const value = e.target.checked
            onMarkAsNonInventoryChange(value)
            if (value) onMarkAsSoldChange(false)
          }}
        />
      </label>
    </div>
  )
}
