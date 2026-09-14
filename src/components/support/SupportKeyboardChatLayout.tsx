'use client'

import {
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
  type UIEvent,
} from 'react'

type Props = {
  children: ReactNode
  composer: ReactNode
  footer?: ReactNode
  overlay?: ReactNode
  listRef?: RefObject<HTMLDivElement | null>
  onScroll?: (event: UIEvent<HTMLDivElement>) => void
  onKeyboardShow?: () => void
}

export function SupportKeyboardChatLayout({
  children,
  composer,
  footer,
  overlay,
  listRef,
  onScroll,
  onKeyboardShow,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const keyboardOpenRef = useRef(false)
  const onKeyboardShowRef = useRef(onKeyboardShow)
  onKeyboardShowRef.current = onKeyboardShow

  useEffect(() => {
    const vv = window.visualViewport
    const root = rootRef.current
    if (!vv || !root) return

    const sync = () => {
      const top = root.getBoundingClientRect().top
      const available = vv.height - (top - vv.offsetTop)
      root.style.height = `${Math.max(Math.round(available), 0)}px`

      const keyboardOpen = window.innerHeight - vv.height > 80
      if (keyboardOpen && !keyboardOpenRef.current) {
        keyboardOpenRef.current = true
        requestAnimationFrame(() => onKeyboardShowRef.current?.())
      }
      if (!keyboardOpen) keyboardOpenRef.current = false
    }

    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    window.addEventListener('resize', sync)
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
      root.style.height = ''
    }
  }, [])

  return (
    <div ref={rootRef} className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1">
        {overlay}
        <div ref={listRef} className="h-full min-h-0 overflow-y-auto" onScroll={onScroll}>
          {children}
        </div>
      </div>
      {footer}
      <div className="border-t border-gray-200 bg-surface">{composer}</div>
    </div>
  )
}
