type Tab<T extends string> = { key: T; label: string }

type Props<T extends string> = {
  tabs: Tab<T>[]
  value: T
  onChange: (value: T) => void
}

export function PillTabs<T extends string>({ tabs, value, onChange }: Props<T>) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {tabs.map((tab) => {
        const active = value === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`rounded-full px-3.5 py-2 text-[14px] font-semibold ${
              active ? 'bg-gray-100 text-ink' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
