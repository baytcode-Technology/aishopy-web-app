type Props = {
  count: number
  className?: string
}

function formatCount(count: number): string {
  if (count > 99) return '99+'
  return String(count)
}

export function UnreadCountBadge({ count, className = '' }: Props) {
  if (count <= 0) return null

  const label = formatCount(count)
  const isWide = label.length > 1

  return (
    <span
      className={`inline-flex h-[18px] items-center justify-center rounded-[9px] bg-[#E11D48] text-[11px] font-bold leading-[13px] text-white ${className}`}
      style={{
        minWidth: isWide ? 20 : 18,
        paddingLeft: isWide ? 5 : 0,
        paddingRight: isWide ? 5 : 0,
      }}
    >
      {label}
    </span>
  )
}
