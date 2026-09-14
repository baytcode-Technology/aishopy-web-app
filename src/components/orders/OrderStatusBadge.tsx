import { formatOrderStatusLabel, getOrderStatusBadgeColors } from '@/core/lib/order-status'

type Props = {
  value: string
}

export function OrderStatusBadge({ value }: Props) {
  const colors = getOrderStatusBadgeColors(value)

  return (
    <span
      className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      {formatOrderStatusLabel(value)}
    </span>
  )
}
