import type { ElementType, HTMLAttributes } from 'react'

type TypographyProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType
  className?: string
}

function typographyClass(base: string, className = '') {
  return className ? `${base} ${className}` : base
}

/**
 * Optical match to Expo Heading (code: 24px / 800).
 * CSS system fonts at 800 look much heavier than RN, so web uses 22px / 600.
 */
export function Heading({ as: Tag = 'h1', className, ...props }: TypographyProps) {
  return (
    <Tag
      className={typographyClass(
        'text-[22px] font-semibold leading-tight tracking-tight text-ink',
        className
      )}
      {...props}
    />
  )
}

/**
 * Optical match to Expo Title (code: 32px / 800).
 * Web uses 28px / 700 so it does not look chunkier than native.
 */
export function Title({ as: Tag = 'h1', className, ...props }: TypographyProps) {
  return (
    <Tag
      className={typographyClass(
        'text-[28px] font-bold leading-tight tracking-tight text-ink',
        className
      )}
      {...props}
    />
  )
}

export function Subtitle({ as: Tag = 'p', className, ...props }: TypographyProps) {
  return (
    <Tag
      className={typographyClass('text-[14px] font-medium leading-5 text-gray-500', className)}
      {...props}
    />
  )
}

export function Body({ as: Tag = 'p', className, ...props }: TypographyProps) {
  return (
    <Tag
      className={typographyClass('text-[15px] leading-5 text-gray-600', className)}
      {...props}
    />
  )
}

export function Caption({ as: Tag = 'p', className, ...props }: TypographyProps) {
  return (
    <Tag
      className={typographyClass('text-xs font-medium leading-tight text-gray-500', className)}
      {...props}
    />
  )
}

export function Muted({ as: Tag = 'p', className, ...props }: TypographyProps) {
  return (
    <Tag
      className={typographyClass('text-sm leading-tight text-gray-500', className)}
      {...props}
    />
  )
}

export function Label({ as: Tag = 'p', className, ...props }: TypographyProps) {
  return (
    <Tag
      className={typographyClass(
        'pl-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500',
        className
      )}
      {...props}
    />
  )
}

export function SectionTitle({ as: Tag = 'p', className, ...props }: TypographyProps) {
  return (
    <Tag
      className={typographyClass(
        'text-xs font-bold uppercase tracking-[0.2em] text-gray-400',
        className
      )}
      {...props}
    />
  )
}

export function LinkText({ as: Tag = 'span', className, ...props }: TypographyProps) {
  return (
    <Tag
      className={typographyClass(
        'text-sm font-semibold text-ink underline underline-offset-2',
        className
      )}
      {...props}
    />
  )
}

export function DisplayBrand({ as: Tag = 'p', className, ...props }: TypographyProps) {
  return (
    <Tag
      className={typographyClass('text-xs font-semibold tracking-brand text-ink', className)}
      {...props}
    />
  )
}
