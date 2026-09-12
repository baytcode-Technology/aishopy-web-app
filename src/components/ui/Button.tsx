import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  loading?: boolean
  variant?: Variant
}

const containerClass: Record<Variant, string> = {
  primary: 'bg-brand-primary border-2 border-brand-primary text-brand-on-primary',
  outline: 'bg-surface border-2 border-ink text-ink',
  ghost: 'bg-transparent border-0 text-gray-500 uppercase tracking-[0.14em] text-xs',
  danger: 'bg-charcoal border-2 border-charcoal text-brand-on-primary',
}

export function Button({
  label,
  loading,
  variant = 'primary',
  disabled,
  className = '',
  type = 'button',
  ...props
}: Props) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`w-full inline-flex items-center justify-center rounded-2xl py-4 min-h-[52px] px-5 text-[15px] font-semibold ${containerClass[variant]} ${isDisabled ? 'opacity-45' : 'hover:opacity-90'} ${className}`}
      {...props}
    >
      {loading ? 'Please wait…' : label}
    </button>
  )
}
