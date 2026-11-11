import type { FocusEventHandler, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string
    error?: string
    multiline?: boolean
  }

function scrollFieldIntoView(element: HTMLElement) {
  requestAnimationFrame(() => {
    const rect = element.getBoundingClientRect()
    const viewport = window.visualViewport
    const visibleTop = viewport?.offsetTop ?? 0
    const visibleBottom = viewport ? viewport.offsetTop + viewport.height : window.innerHeight
    if (rect.bottom > visibleBottom - 12 || rect.top < visibleTop + 8) {
      element.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  })
}

export function Input({
  label,
  error,
  multiline,
  className = '',
  onFocus,
  ...props
}: Props) {
  const fieldClass = `w-full border rounded-2xl px-4 py-3.5 text-[15px] font-medium text-ink bg-gray-50 border-gray-200 outline-none focus:border-ink focus:bg-surface ${
    error ? 'border-[#E11D48] bg-[#FFF1F2]' : ''
  } ${className}`

  const reveal: FocusEventHandler<HTMLInputElement & HTMLTextAreaElement> = (event) => {
    onFocus?.(event)
    scrollFieldIntoView(event.currentTarget)
  }

  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-[13px] font-bold tracking-wide text-gray-600">{label}</span>
      {multiline ? (
        <textarea
          className={`${fieldClass} min-h-[100px] resize-y`}
          onFocus={reveal}
          {...props}
        />
      ) : (
        <input className={fieldClass} onFocus={reveal} {...props} />
      )}
      {error ? (
        <span className="pl-0.5 text-[12px] font-medium text-[#E11D48]">{error}</span>
      ) : null}
    </label>
  )
}
