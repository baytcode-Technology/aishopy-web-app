'use client'

import { MenuIcon } from '@/components/ui/MenuIcons'
import { useAppTheme } from '@/providers/theme-provider'
import { CHAT_GATE_FEATURES, type ChatGateIcon } from '@/core/lib/subscription'

type Props = {
  onViewPlans: () => void
}

const WHATSAPP = '#25D366'
const GREEN = '#3EB056'

function WhatsAppMark() {
  return (
    <svg className="h-[42px] w-[42px] shrink-0" viewBox="0 0 42 42" aria-hidden>
      <rect width="42" height="42" rx="13" fill={WHATSAPP} />
      <path
        d="M21 10.5c-5.2 0-9.4 4-9.4 9 0 1.6.5 3.1 1.3 4.4l-1.2 4.2 4.3-1.1c1.2.7 2.6 1 4 1 5.2 0 9.4-4 9.4-9s-4.2-8.5-9.4-8.5z"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
      />
      <path d="M14.6 27.2 12.4 31.2 16.8 28.4Z" fill="#fff" />
      <path
        d="M17.1 17.2c.2-.4.4-.4.6-.4h.6c.2 0 .4.1.5.4.2.5.6 1.5.7 1.6.1.1.1.3 0 .4-.1.2-.2.3-.3.4l-.3.3c-.1.1-.2.2-.1.4.1.2.6 1 1.2 1.5.8.7 1.5 1 1.7 1.1.2.1.3.1.4-.1.1-.1.5-.6.6-.8.1-.2.3-.2.5-.1.2.1 1.1.5 1.3.6.2.1.3.2.4.3.1.2.1.6-.1 1.1-.2.5-1 .9-1.3 1-.4.1-.8.1-1.2 0-.3-.1-.7-.2-1.2-.4-1.9-.8-3.2-2.4-3.7-3-.5-.6-1.2-1.7-1.2-2.6 0-1 .5-1.4.6-1.6.2-.2.4-.3.6-.3z"
        fill="#fff"
      />
    </svg>
  )
}

function InstagramMark() {
  return (
    <svg className="h-[42px] w-[42px] shrink-0" viewBox="0 0 42 42" aria-hidden>
      <defs>
        <linearGradient id="igTile" x1="4" y1="40" x2="40" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FCAF45" />
          <stop offset="0.35" stopColor="#F77737" />
          <stop offset="0.62" stopColor="#C13584" />
          <stop offset="1" stopColor="#833AB4" />
        </linearGradient>
      </defs>
      <rect width="42" height="42" rx="13" fill="url(#igTile)" />
      <rect x="12" y="12" width="18" height="18" rx="5.5" stroke="#fff" strokeWidth="1.8" fill="none" />
      <circle cx="21" cy="21" r="4.2" stroke="#fff" strokeWidth="1.8" fill="none" />
      <circle cx="26.4" cy="15.6" r="1.25" fill="#fff" />
    </svg>
  )
}

function RobotMark({ isDark }: { isDark: boolean }) {
  return (
    <span
      className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] ${
        isDark ? 'bg-white/10' : 'bg-[#F3F4F6]'
      }`}
    >
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill={isDark ? '#E4E4E7' : '#3F3F46'} aria-hidden>
        <path d="M11 2h2v2h3a3 3 0 0 1 3 3v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V7a3 3 0 0 1 3-3h3V2Zm-2.2 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6.4 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM9 14.2h6v1.6H9v-1.6Z" />
      </svg>
    </span>
  )
}

function FeatureIcon({ name, isDark }: { name: ChatGateIcon; isDark: boolean }) {
  if (name === 'whatsapp') return <WhatsAppMark />
  if (name === 'instagram') return <InstagramMark />
  if (name === 'robot') return <RobotMark isDark={isDark} />
  return (
    <span
      className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] ${
        isDark ? 'bg-[#25D366]/15' : 'bg-[#E9F9EF]'
      }`}
    >
      <svg className="h-7 w-7" viewBox="0 0 26 26" aria-hidden>
        <path d="M3 22V14h4.2v8H3Z" fill="#8BE3A4" />
        <path d="M10.2 22V9h4.2v13h-4.2Z" fill={GREEN} />
        <path d="M17.4 22V4.5H21.6V22h-4.2Z" fill={WHATSAPP} />
        <path d="M14.2 7.2 19.4 2.2l1.6 1.6-5.2 5-1.6-1.6Z" fill={WHATSAPP} />
        <path d="M16.2 2.2h5.2V7h-2.1V4.3h-3.1V2.2Z" fill={WHATSAPP} />
      </svg>
    </span>
  )
}

function RowCheck() {
  return (
    <span
      className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-white"
      style={{ backgroundColor: WHATSAPP }}
      aria-hidden
    >
      <MenuIcon name="check" className="h-5 w-5 text-white" />
    </span>
  )
}

function HeroBubble() {
  return (
    <svg className="h-[52px] w-[52px]" viewBox="0 0 52 52" aria-hidden>
      <defs>
        <linearGradient id="heroBubble" x1="6" y1="4" x2="46" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8BE3A4" />
          <stop offset="0.45" stopColor="#3EB056" />
          <stop offset="1" stopColor="#1B7A34" />
        </linearGradient>
      </defs>
      <path
        d="M10 6h28a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H28l-6 8 1.5-8H10a8 8 0 0 1-8-8V14a8 8 0 0 1 8-8z"
        fill="url(#heroBubble)"
      />
      <path
        d="M12 9.5h24a5 5 0 0 1 5 5"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="18" cy="22" r="3.1" fill="#fff" />
      <circle cx="26" cy="22" r="3.1" fill="#fff" />
      <circle cx="34" cy="22" r="3.1" fill="#fff" />
    </svg>
  )
}

export function ChatsSubscriptionGate({ onViewPlans }: Props) {
  const { isDark } = useAppTheme()

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 pb-28 pt-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-8 h-56 w-56 rounded-full"
        style={{
          background: isDark ? 'rgba(20, 90, 40, 0.55)' : 'rgba(62, 176, 86, 0.16)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-24 h-40 w-40 rounded-full"
        style={{
          background: isDark ? 'rgba(62, 176, 86, 0.12)' : 'rgba(62, 176, 86, 0.1)',
        }}
      />
      {isDark ? null : (
        <div
          aria-hidden
          className="pointer-events-none absolute right-6 top-4 h-9 w-14"
          style={{
            backgroundImage: 'radial-gradient(rgba(62,176,86,0.45) 1.2px, transparent 1.3px)',
            backgroundSize: '12px 12px',
          }}
        />
      )}

      <div
        className="relative mt-8 w-full rounded-[28px] px-5 pb-6 pt-12 text-center backdrop-blur-xl"
        style={{
          backgroundColor: isDark ? 'rgba(12, 14, 13, 0.9)' : 'rgba(255, 255, 255, 0.8)',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: isDark ? 'rgba(62, 176, 86, 0.35)' : 'rgba(255, 255, 255, 0.95)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-28px] h-12 w-32 rounded-full border"
          style={{
            transform: 'translateX(-50%) rotate(-18deg)',
            borderColor: 'rgba(62, 176, 86, 0.4)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-10px] h-24 w-24 -translate-x-1/2 rounded-full border"
          style={{ borderColor: 'rgba(62, 176, 86, 0.22)' }}
        />
        <div
          className={`absolute left-1/2 top-0 flex h-[68px] w-[68px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[20px] border ${
            isDark
              ? 'bg-[#101412] shadow-[0_8px_24px_rgba(62,176,86,0.35)]'
              : 'bg-white/90 shadow-[0_8px_24px_rgba(62,176,86,0.18)]'
          }`}
          style={{
            borderColor: isDark ? 'rgba(62, 176, 86, 0.7)' : 'rgba(62, 176, 86, 0.35)',
          }}
        >
          <HeroBubble />
        </div>

        <h2 className="text-[22px] font-extrabold leading-7 tracking-tight text-ink">
          Unlock <span style={{ color: WHATSAPP }}>WhatsApp</span> &
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(90deg, #833AB4 0%, #C13584 42%, #E1306C 68%, #F77737 100%)',
            }}
          >
            Instagram
          </span>{' '}
          Inbox
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-gray-500">
          Upgrade to Business to manage customer conversations, automate replies, and grow sales
          from chat.
        </p>

        <div className="mt-6 flex w-full flex-col gap-2.5 text-left">
          {CHAT_GATE_FEATURES.map((feature) => (
            <div
              key={feature.label}
              className={`flex items-center gap-3 rounded-full px-4 py-3 ${
                isDark ? 'border border-white/10 bg-white/[0.04]' : 'border border-gray-200 bg-white/90'
              }`}
            >
              <FeatureIcon name={feature.icon} isDark={isDark} />
              <p className="flex-1 text-[14px] leading-5 text-ink">{feature.label}</p>
              <RowCheck />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onViewPlans}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[16px] font-bold text-white"
          style={{
            backgroundImage: 'linear-gradient(90deg, #8BE3A4 0%, #3EB056 58%, #2F9A48 100%)',
          }}
        >
          View plans <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  )
}
