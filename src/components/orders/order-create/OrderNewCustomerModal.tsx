'use client'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createCustomer } from '@/core/api/customers'
import { getErrorMessage } from '@/core/lib/api-error'
import type { Customer } from '@/core/types/customer'
import { useMemo, useState } from 'react'

type Props = {
  open: boolean
  storeId: number
  onClose: () => void
  onCreated: (customer: Customer) => void
}

export function OrderNewCustomerModal({ open, storeId, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSave = useMemo(() => name.trim().length > 0, [name])

  const reset = () => {
    setName('')
    setPhone('')
    setEmail('')
    setError('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSave = async () => {
    if (!canSave) return
    setLoading(true)
    setError('')
    try {
      const res = await createCustomer({
        store_id: storeId,
        name: name.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(email.trim() ? { email: email.trim() } : {}),
      })
      reset()
      onCreated(res.data)
      onClose()
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save customer'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title="New customer"
      onClose={handleClose}
      footer={
        <div className="flex flex-col gap-3">
          {error ? <p className="text-center text-[13px] font-medium text-[#E11D48]">{error}</p> : null}
          <Button label="Save customer" loading={loading} disabled={!canSave} onClick={() => void handleSave()} />
          <button type="button" onClick={handleClose} className="py-1 text-center text-[15px] font-medium text-gray-500">
            Cancel
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
        <Input
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          type="tel"
        />
        <Input
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          type="email"
          autoCapitalize="none"
        />
      </div>
    </Modal>
  )
}
