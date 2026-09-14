import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'destructive'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  loading?: boolean
  variant?: Variant
}

const containerClass: Record<Variant, string> = {
  primary: 'bg-brand-primary border-2 border-brand-primary text-brand-on-primary font-semibold',
  outline: 'bg-surface border-2 border-ink text-ink font-semibold',
  ghost: 'bg-transparent border-0 text-gray-500 uppercase tracking-[0.14em] text-xs font-semibold',
  danger: 'bg-charcoal border-2 border-charcoal text-brand-on-primary font-semibold',
  destructive: 'border-2 font-bold tracking-wide',
}

export function Button({
  label,
  loading,
  variant = 'primary',
  disabled,
  className = '',
  type = 'button',
  style,
  ...props
}: Props) {
  const isDisabled = disabled || loading
  const destructiveStyle =
    variant === 'destructive'
      ? { backgroundColor: '#E11D48', borderColor: '#E11D48', color: '#FFFFFF' }
      : undefined

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`w-full inline-flex items-center justify-center rounded-2xl py-4 min-h-[52px] px-5 text-[15px] ${containerClass[variant]} ${isDisabled ? 'opacity-45' : 'hover:opacity-90'} ${className}`}
      style={{ ...destructiveStyle, ...style }}
      {...props}
    >
      {loading ? 'Please wait…' : label}
    </button>
  )
}
