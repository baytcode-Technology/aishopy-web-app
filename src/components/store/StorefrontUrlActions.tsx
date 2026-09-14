'use client'

import { MenuIcon } from '@/components/ui/MenuIcons'
import { useState } from 'react'

type Props = {
  /** Full URL with protocol, e.g. https://ghu.aishopy.io */
  url: string
  /** Host only for display, e.g. ghu.aishopy.io */
  displayHost: string
}

export function StorefrontUrlActions({ url, displayHost }: Props) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt('Copy store link', url)
    }
  }

  const shareLink = async () => {
    const message = `Visit my store: ${url}`
    if (navigator.share) {
      try {
        await navigator.share({ title: displayHost, text: message, url })
        return
      } catch {
        // User dismissed share sheet
        return
      }
    }
    await copyLink()
  }

  return (
    <div className="mt-0 flex items-center gap-2">
      <a href={url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-blue-500">{displayHost}</p>
      </a>
      <button
        type="button"
        onClick={() => void copyLink()}
        aria-label="Copy store link"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-brand-primary"
      >
        <MenuIcon name={copied ? 'check' : 'copy'} className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => void shareLink()}
        aria-label="Share store link"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-brand-primary"
      >
        <MenuIcon name="share-alt" className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
