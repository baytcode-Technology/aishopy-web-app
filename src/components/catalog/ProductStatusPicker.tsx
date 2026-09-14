import { PRODUCT_STATUS_OPTIONS, PRODUCT_STATUS_THEME } from '@/core/lib/product-status'
import type { ProductStatus } from '@/core/types/product'

type Props = {
  value: ProductStatus
  onChange: (status: ProductStatus) => void
  label?: string
  disabled?: boolean
  compact?: boolean
}

export function ProductStatusPicker({
  value,
  onChange,
  label = 'Status',
  disabled,
  compact,
}: Props) {
  return (
    <fieldset>
      <legend
        className={`font-bold tracking-wide text-gray-600 ${compact ? 'mb-1.5 text-[11px]' : 'mb-2 text-[13px]'}`}
      >
        {label}
      </legend>
      <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
        {PRODUCT_STATUS_OPTIONS.map((option) => {
          const selected = value === option
          const theme = PRODUCT_STATUS_THEME[option]
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option)}
              className={`min-w-[30%] flex-1 border font-bold ${
                compact ? 'rounded-lg px-1.5 py-2 text-[11px]' : 'rounded-xl px-2 py-3 text-[13px]'
              } ${selected ? '' : 'border-gray-200 bg-surface text-gray-600'} ${
                disabled ? 'opacity-50' : ''
              }`}
              style={
                selected
                  ? {
                      backgroundColor: theme.pickerSelectedBg,
                      borderColor: theme.pickerSelectedBorder,
                      color: theme.pickerSelectedText,
                    }
                  : undefined
              }
            >
              {theme.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
