'use client'

import { useAuth } from '@/providers/auth-provider'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function HeaderOverflow() {
  const router = useRouter()
  const { signOut } = useAuth()
  const { clearStore } = useStore()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const handleSignOut = async () => {
    setOpen(false)
    await clearStore()
    await signOut()
    router.replace('/login')
  }

  return (
    <div ref={wrapRef} className="relative lg:hidden">
      <button
        type="button"
        aria-label="More"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink"
      >
        <span className="text-lg font-bold leading-none">···</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-44 rounded-2xl border border-gray-200 bg-surface py-1 shadow-lg">
          <button
            type="button"
            className="block w-full px-4 py-2.5 text-left text-[13px] font-semibold text-ink hover:bg-gray-50"
            onClick={() => {
              setOpen(false)
              router.push('/select-store')
            }}
          >
            Switch store
          </button>
          <button
            type="button"
            className="block w-full px-4 py-2.5 text-left text-[13px] font-semibold text-gray-500 hover:bg-gray-50"
            onClick={() => void handleSignOut()}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
