'use client'

type Props = {
  value: boolean
  disabled?: boolean
  onValueChange: (value: boolean) => void
  'aria-label'?: string
}

export function Switch({ value, disabled, onValueChange, 'aria-label': ariaLabel }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onValueChange(!value)}
      className={`relative h-6 w-11 shrink-0 rounded-full ${value ? 'bg-[#0A0A0B]' : 'bg-[#E4E4E7]'} ${
        disabled ? 'opacity-45' : ''
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${
          value ? 'right-0.5' : 'left-0.5'
        }`}
      />
    </button>
  )
}
