'use client'

import { UnsavedChangesDialog } from '@/components/ui/UnsavedChangesDialog'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type Options = {
  isDirty: boolean
  isLoading?: boolean
  onSave: () => Promise<boolean>
}

export function useUnsavedChangesExit({ isDirty, isLoading = false, onSave }: Options) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const completeExit = useCallback(() => {
    setOpen(false)
    router.back()
  }, [router])

  const requestBack = useCallback(() => {
    if (isLoading || !isDirty) {
      router.back()
      return
    }
    setOpen(true)
  }, [isDirty, isLoading, router])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const ok = await onSave()
      if (ok) completeExit()
    } finally {
      setSaving(false)
    }
  }, [completeExit, onSave])

  useEffect(() => {
    if (!isDirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  const dialog = (
    <UnsavedChangesDialog
      open={open}
      loading={saving}
      onSave={() => void handleSave()}
      onDiscard={completeExit}
      onCancel={() => setOpen(false)}
    />
  )

  return { requestBack, dialog }
}
