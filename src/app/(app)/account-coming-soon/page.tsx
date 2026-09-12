'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { MenuIcon, type MenuIconName } from '@/components/ui/MenuIcons'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type FeatureId =
  | 'payment-methods'
  | 'razorpay'
  | 'cash-on-delivery'
  | 'upi'
  | 'notifications'
  | 'printer'
  | 'subscription'
  | 'staff-management'
  | 'website'
  | 'chat-boat'
  | 'help-center'
  | 'support-inbox'
  | 'whatsapp'
  | 'instagram'

const FEATURES: Record<
  FeatureId,
  {
    title: string
    subtitle: string
    icon: MenuIconName
    description: string
    features?: string[]
  }
> = {
  'payment-methods': {
    title: 'Payment methods',
    subtitle: 'Checkout & payouts',
    icon: 'credit-card',
    description:
      'Connect Razorpay, COD, and other payment options for your store. This will be available soon.',
  },
  razorpay: {
    title: 'Razorpay',
    subtitle: 'Online payments',
    icon: 'credit-card',
    description:
      'Accept cards, wallets, and netbanking through Razorpay. Connect your account and start taking online payments soon.',
    features: [
      'Link your Razorpay merchant account',
      'Accept credit and debit cards',
      'Enable wallets and netbanking',
      'Automatic payment status on orders',
      'Secure checkout on your storefront',
    ],
  },
  'cash-on-delivery': {
    title: 'Cash on delivery',
    subtitle: 'Pay on delivery',
    icon: 'money',
    description:
      'Let customers pay when their order is delivered. Turn COD on or off and set rules from here soon.',
    features: [
      'Enable or disable COD per store',
      'Optional minimum order amount',
      'Mark orders as paid on delivery',
      'Works with your existing order flow',
    ],
  },
  upi: {
    title: 'UPI',
    subtitle: 'Instant UPI payments',
    icon: 'mobile',
    description:
      'Collect payments via UPI apps like PhonePe, Google Pay, and Paytm. Setup and QR options are coming soon.',
    features: [
      'Display UPI ID or QR at checkout',
      'Support popular UPI apps',
      'Confirm payment from the app',
      'Works alongside Razorpay and COD',
    ],
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Alerts & preferences',
    icon: 'bell',
    description:
      'Manage order alerts, chat notifications, and marketing updates. This will be available soon.',
  },
  printer: {
    title: 'Printer',
    subtitle: 'Receipts & labels',
    icon: 'print',
    description:
      'Pair a thermal printer for order receipts and packing slips. This will be available soon.',
  },
  subscription: {
    title: 'Subscription',
    subtitle: 'Plan & billing',
    icon: 'calendar',
    description:
      'View your AiShopy plan, billing history, and upgrade options. This will be available soon.',
  },
  'staff-management': {
    title: 'Staff management',
    subtitle: 'Roles & team access',
    icon: 'users',
    description:
      'Invite staff, assign roles, and manage who can access your store inbox and orders. This will be available soon.',
  },
  website: {
    title: 'Website',
    subtitle: 'Storefront UI design',
    icon: 'paint-brush',
    description:
      'Design your store website visually — themes, layouts, and branding — without writing code. We are building this for you.',
    features: [
      'Pick themes and color palettes that match your brand',
      'Customize homepage sections, banners, and hero areas',
      'Arrange product grids and category layouts',
      'Set fonts, logo placement, and button styles',
      'Preview on mobile and desktop before you publish',
      'One-tap publish to your AiShopy storefront link',
    ],
  },
  'chat-boat': {
    title: 'Chat Boat',
    subtitle: 'Inbox auto-reply',
    icon: 'magic',
    description:
      'Turn Chat Boat on or off and tune how it answers customers in your inbox. This will be available soon.',
  },
  'help-center': {
    title: 'Help center',
    subtitle: 'Guides & answers',
    icon: 'question-circle-o',
    description:
      'Browse AiShopy help articles and ask Chat with AI about your store. This will be available soon.',
  },
  'support-inbox': {
    title: 'Support inbox',
    subtitle: 'Platform tickets',
    icon: 'inbox',
    description:
      'Review merchant Chat with AI threads and escalated tickets. This will be available soon.',
  },
  whatsapp: {
    title: 'WhatsApp',
    subtitle: 'Connect phone + inbox',
    icon: 'whatsapp',
    description:
      'Link your WhatsApp Business number and manage chats from AiShopy. This will be available soon.',
  },
  instagram: {
    title: 'Instagram',
    subtitle: 'Connect business account',
    icon: 'instagram',
    description:
      'Connect your Instagram business account and reply from AiShopy. This will be available soon.',
  },
}

function AccountComingSoonBody() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id') as FeatureId | null
  const feature = FEATURES[id ?? 'payment-methods'] ?? FEATURES['payment-methods']

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title={feature.title}
        subtitle={feature.subtitle}
        onBack={() => router.back()}
      />
      <div className="px-5 pb-10 pt-6">
        <div className="flex flex-col items-center rounded-[28px] border border-gray-200 bg-surface px-8 py-12 shadow-sm">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-brand-primary">
            <MenuIcon name={feature.icon} className="h-7 w-7" />
          </div>
          <h2 className="mb-3 text-center text-2xl font-semibold tracking-tight text-ink">
            Coming soon
          </h2>
          <p className="max-w-[300px] text-center text-[15px] leading-6 text-gray-500">
            {feature.description}
          </p>

          {feature.features && feature.features.length > 0 ? (
            <div className="mt-8 w-full border-t border-gray-100 pt-6">
              <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
                Planned features
              </p>
              <div className="flex flex-col gap-3">
                {feature.features.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-brand-primary">
                      <MenuIcon name="check" className="h-2.5 w-2.5" />
                    </div>
                    <p className="flex-1 text-[14px] leading-5 text-gray-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}

export default function AccountComingSoonPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-full bg-gray-100">
          <CatalogHeader title="Coming soon" />
        </main>
      }
    >
      <AccountComingSoonBody />
    </Suspense>
  )
}
