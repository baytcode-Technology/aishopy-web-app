'use client'

import { MenuIcon } from '@/components/ui/MenuIcons'
import { MenuRow } from '@/components/ui/MenuRow'
import type { ComponentProps } from 'react'

type MenuRowProps = ComponentProps<typeof MenuRow>

type Props = MenuRowProps & {
  locked: boolean
  onLockedPress: () => void
}

export function LockedMenuRow({ locked, onLockedPress, onPress, ...menuRowProps }: Props) {
  if (!locked) {
    return <MenuRow {...menuRowProps} onPress={onPress} />
  }

  return (
    <button type="button" onClick={onLockedPress} className="w-full text-left">
      <div className="relative opacity-45">
        <MenuRow {...menuRowProps} onPress={undefined} showChevron={false} />
        <div className="pointer-events-none absolute right-3 top-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-surface text-brand-primary">
            <MenuIcon name="crown" className="h-3 w-3" />
          </div>
        </div>
      </div>
    </button>
  )
}
