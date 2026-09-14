import { DetailSection } from '@/components/catalog/DetailSection'

type Props = {
  paymentId: string
}

export function OrderRazorpayPaymentCard({ paymentId }: Props) {
  return (
    <DetailSection className="p-3.5">
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-bold text-ink">Razorpay payment</p>
        <p className="text-[12px] text-gray-500">Paid online · auto-confirmed</p>
        <p className="mt-2 select-all text-[13px] text-ink">{paymentId}</p>
      </div>
    </DetailSection>
  )
}
