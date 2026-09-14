type Props = {
  label: string
  variant?: 'inline' | 'sticky'
}

export function ChatDateSeparator({ label, variant = 'inline' }: Props) {
  const pill = (
    <div
      className={`rounded-full border border-gray-200 px-3 py-1.5 shadow-sm ${
        variant === 'sticky' ? 'bg-surface/95' : 'bg-surface/90'
      }`}
    >
      <p className="text-xs font-semibold text-gray-600">{label}</p>
    </div>
  )

  if (variant === 'sticky') {
    return <div className="flex justify-center">{pill}</div>
  }

  return <div className="my-3 flex justify-center">{pill}</div>
}
