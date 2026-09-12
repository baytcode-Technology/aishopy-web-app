export function EmptyThumb({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size * 0.42}
      height={size * 0.42}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5H9l1.2-1.6A1.5 1.5 0 0 1 11.4 3h1.2c.46 0 .9.21 1.2.56L15 5h2.5A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="#9CA3AF"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="1.6" />
    </svg>
  )
}
