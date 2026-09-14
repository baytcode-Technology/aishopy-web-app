type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search…' }: Props) {
  return (
    <label className="mx-5 mb-3 flex items-center gap-3 rounded-[22px] border border-gray-200 bg-surface px-4 py-3.5 shadow-sm">
      <svg className="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0-2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2Z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[16px] font-medium text-ink outline-none placeholder:text-gray-400"
      />
    </label>
  )
}
