import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string
    error?: string
    multiline?: boolean
  }

export function Input({
  label,
  error,
  multiline,
  className = '',
  ...props
}: Props) {
  const fieldClass = `w-full border rounded-2xl px-4 py-3.5 text-[15px] font-medium text-ink bg-gray-50 border-gray-200 outline-none focus:border-ink focus:bg-surface ${
    error ? 'border-[#E11D48] bg-[#FFF1F2]' : ''
  } ${className}`

  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-[13px] font-bold tracking-wide text-gray-600">{label}</span>
      {multiline ? (
        <textarea className={`${fieldClass} min-h-[100px] resize-y`} {...props} />
      ) : (
        <input className={fieldClass} {...props} />
      )}
      {error ? (
        <span className="pl-0.5 text-[12px] font-medium text-[#E11D48]">{error}</span>
      ) : null}
    </label>
  )
}
