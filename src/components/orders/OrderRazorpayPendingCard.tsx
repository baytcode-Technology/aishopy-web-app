import { DetailSection } from '@/components/catalog/DetailSection'

type Props = {
  failed?: boolean
}

export function OrderRazorpayPendingCard({ failed }: Props) {
  return (
    <DetailSection className="border-amber-200 bg-amber-50 p-3.5">
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-bold text-ink">
          {failed ? 'Razorpay payment failed' : 'Awaiting Razorpay payment'}
        </p>
        <p className="text-[12px] leading-5 text-gray-600">
          {failed
            ? 'The customer’s online payment did not go through. They can try again from your storefront checkout, or you can cancel this order.'
            : 'The customer started checkout but has not paid yet. Payment confirms automatically when they complete Razorpay checkout on your storefront.'}
        </p>
      </div>
    </DetailSection>
  )
}
