'use client'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={() => {
        if (!loading) onCancel()
      }}
      footer={
        <div className="flex gap-3">
          <Button label={cancelLabel} variant="outline" disabled={loading} onClick={onCancel} />
          <Button label={confirmLabel} variant="danger" loading={loading} onClick={onConfirm} />
        </div>
      }
    >
      <p className="text-[15px] leading-6 text-gray-600">{message}</p>
    </Modal>
  )
}
