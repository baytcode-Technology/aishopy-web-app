type IconProps = { className?: string }

export function ChatsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21 6.5A2.5 2.5 0 0 0 18.5 4h-13A2.5 2.5 0 0 0 3 6.5v8A2.5 2.5 0 0 0 5.5 17H8v3.2a.7.7 0 0 0 1.15.54L13.1 17H18.5A2.5 2.5 0 0 0 21 14.5v-8Z" />
    </svg>
  )
}

export function ProductsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z" />
    </svg>
  )
}

export function OrdersIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 6V5a5 5 0 0 1 10 0v1h2.2a1 1 0 0 1 .98 1.2l-1.7 10A2 2 0 0 1 16.52 19H7.48a2 2 0 0 1-1.96-1.8l-1.7-10A1 1 0 0 1 4.8 6H7Zm2 0h6V5a3 3 0 0 0-6 0v1Z" />
    </svg>
  )
}

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 13a8 8 0 1 1 16 0v6a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1v-6Zm8-6a6 6 0 0 0-6 6h4a2 2 0 1 1 4 0h4a6 6 0 0 0-6-6Z" />
    </svg>
  )
}
