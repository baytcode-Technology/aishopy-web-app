type Props = {
  onClick: () => void
  label?: string
}

export function Fab({ onClick, label = 'Create' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-24 right-5 z-10 flex h-[60px] w-[60px] items-center justify-center rounded-full border border-brand-primary bg-brand-primary text-2xl font-semibold text-brand-on-primary shadow-lg lg:bottom-8"
    >
      +
    </button>
  )
}
