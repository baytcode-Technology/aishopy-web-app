type Props = {
  value: string
  onChange: (text: string) => void
  placeholder?: string
}

export function OrderSearchBar({ value, onChange, placeholder = 'Search' }: Props) {
  return (
    <label className="flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-gray-50 px-3.5">
      <svg className="h-[15px] w-[15px] shrink-0 text-gray-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0-2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2Z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoCorrect="off"
        autoCapitalize="none"
        className="w-full bg-transparent py-3 text-[15px] text-ink outline-none placeholder:text-gray-400"
      />
    </label>
  )
}
