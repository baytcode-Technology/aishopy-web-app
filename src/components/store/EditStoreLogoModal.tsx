'use client'

import { StoreLogoPicker, type PickedLogo } from '@/components/store/StoreLogoPicker'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { updateMyStore } from '@/core/api/stores'
import { getErrorMessage } from '@/core/lib/api-error'
import type { Store } from '@/core/types/store'
import { uploadProductImages } from '@/platform/upload-images'
import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  store: Store | null
  onClose: () => void
  onUpdated: (store: Store) => void
}

export function EditStoreLogoModal({ open, store, onClose, onUpdated }: Props) {
  const [image, setImage] = useState<PickedLogo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setImage(null)
      setError(null)
    }
  }, [open])

  const handleClose = () => {
    setImage(null)
    setError(null)
    onClose()
  }

  const handleSave = async () => {
    if (!store) return
    if (!image) {
      setError('Choose a new logo image')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [logoUrl] = await uploadProductImages(store.id, [image.file])

      if (logoUrl === store.logo_url) {
        handleClose()
        return
      }

      const res = await updateMyStore(store.id, { logo_url: logoUrl })
      onUpdated(res.data.store)
      handleClose()
    } catch (e) {
      setError(getErrorMessage(e, 'Could not update logo'))
    } finally {
      setLoading(false)
    }
  }

  if (!store) return null

  return (
    <Modal
      open={open}
      title="Edit logo"
      subtitle="Choose a new image for your store"
      onClose={handleClose}
      footer={<Button label="Save logo" loading={loading} onClick={() => void handleSave()} />}
    >
      <div className="flex flex-col gap-3">
        {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}
        <StoreLogoPicker
          image={image}
          remoteUrl={store.logo_url}
          storeName={store.name}
          onChange={setImage}
          variant="round"
        />
      </div>
    </Modal>
  )
}
