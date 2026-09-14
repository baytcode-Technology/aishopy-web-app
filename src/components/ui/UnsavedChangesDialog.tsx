'use client'

import { Modal } from '@/components/ui/Modal'

type Props = {
  open: boolean
  loading?: boolean
  title?: string
  message?: string
  onSave: () => void
  onDiscard: () => void
  onCancel: () => void
}

export function UnsavedChangesDialog({
  open,
  loading = false,
  title = 'Save changes?',
  message = 'You have unsaved changes on this page. Save before leaving?',
  onSave,
  onDiscard,
  onCancel,
}: Props) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={() => {
        if (!loading) onCancel()
      }}
      footer={
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onDiscard}
            disabled={loading}
            className={`flex-1 rounded-xl border border-gray-200 bg-surface py-3 text-center text-[14px] font-bold text-ink ${
              loading ? 'opacity-50' : ''
            }`}
          >
            Don&apos;t save
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            className="flex-1 rounded-xl bg-brand-green py-3 text-center text-[14px] font-bold text-white"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Please wait…' : 'Save'}
          </button>
        </div>
      }
    >
      <p className="text-[14px] leading-5 text-gray-500">{message}</p>
    </Modal>
  )
}
