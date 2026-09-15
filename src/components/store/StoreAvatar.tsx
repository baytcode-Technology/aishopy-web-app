import type { Store } from '@/core/types/store'

type Props = {
  store: Pick<Store, 'name' | 'logo_url'> | null
  size?: 'sm' | 'md'
}

const sizeStyles = {
  sm: {
    box: 'h-14 w-14 rounded-2xl',
    letter: 'text-xl',
  },
  md: {
    box: 'h-16 w-16 rounded-2xl',
    letter: 'text-2xl',
  },
} as const

export function StoreAvatar({ store, size = 'md' }: Props) {
  const letter = store?.name?.slice(0, 1).toUpperCase() ?? 'S'
  const styles = sizeStyles[size]
  const boxClass = `${styles.box} shrink-0 overflow-hidden border border-gray-200`

  if (store?.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={store.logo_url} alt="" className={`${boxClass} bg-gray-50 object-cover`} />
    )
  }

  return (
    <div className={`${boxClass} flex items-center justify-center bg-gray-100`}>
      <span className={`font-extrabold text-ink ${styles.letter}`}>{letter}</span>
    </div>
  )
}
