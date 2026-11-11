'use client'

type Props = {
  value: boolean
  disabled?: boolean
  onValueChange: (value: boolean) => void
  'aria-label'?: string
  /** `ink` keeps payment-method charcoal. `primary` follows theme brand (Chat Boat). */
  onTrack?: 'ink' | 'primary'
}

export function Switch({
  value,
  disabled,
  onValueChange,
  'aria-label': ariaLabel,
  onTrack = 'ink',
}: Props) {
  const onClass = onTrack === 'primary' ? 'bg-brand-primary' : 'bg-ink'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onValueChange(!value)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full ${value ? onClass : 'bg-gray-300'} ${
        disabled ? 'opacity-45' : ''
      }`}
    >
      <span
        className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-surface shadow"
        style={{ left: value ? 22 : 2 }}
      />
    </button>
  )
}
