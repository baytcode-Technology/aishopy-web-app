'use client'

import { PaymentMethodConfigLayout } from '@/components/store/PaymentMethodConfigLayout'
import { Button } from '@/components/ui/Button'
import { PaymentMethodConfigSkeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { fetchPaymentConfig, updatePaymentConfig } from '@/core/api/payment-config'
import { getErrorMessage } from '@/core/lib/api-error'
import { useUnsavedChangesExit } from '@/hooks/useUnsavedChangesExit'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function CodPaymentPage() {
  const router = useRouter()
  const { store, role } = useStore()
  const [enabled, setEnabled] = useState(true)
  const [savedEnabled, setSavedEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (role === 'staff') {
      setNotice('Only the store owner can change payment methods')
      router.back()
    }
  }, [role, router])

  const isDirty = !loading && enabled !== savedEnabled

  const load = useCallback(async () => {
    if (!store?.id || role === 'staff') return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchPaymentConfig(store.id)
      const nextEnabled = res.data.payment_config.cod.enabled
      setEnabled(nextEnabled)
      setSavedEnabled(nextEnabled)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load payment settings'))
    } finally {
      setLoading(false)
    }
  }, [store?.id, role])

  useEffect(() => {
    void load()
  }, [load])

  const save = useCallback(async (): Promise<boolean> => {
    if (!store?.id) return false
    setSaving(true)
    setError(null)
    try {
      await updatePaymentConfig(store.id, { cod: { enabled } })
      setSavedEnabled(enabled)
      setNotice('Cash on delivery settings saved')
      return true
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save settings'))
      return false
    } finally {
      setSaving(false)
    }
  }, [enabled, store?.id])

  const { requestBack, dialog } = useUnsavedChangesExit({
    isDirty,
    isLoading: loading,
    onSave: save,
  })

  if (role === 'staff') return null

  return (
    <PaymentMethodConfigLayout
      title="Cash on delivery"
      subtitle="Pay when the order arrives"
      onBack={requestBack}
      footer={<Button label="Save" loading={saving} disabled={loading} onClick={() => void save()} />}
    >
      {notice ? <p className="text-sm font-semibold text-brand-green">{notice}</p> : null}
      {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}
      {loading ? (
        <PaymentMethodConfigSkeleton inputCount={0} showSecondCard />
      ) : (
        <>
          <div className="rounded-[28px] border border-gray-200 bg-surface px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-4">
                <p className="text-[15px] font-semibold text-ink">Enable COD</p>
                <p className="mt-1 text-xs text-gray-500">
                  Customers can choose cash on delivery at checkout. You or your delivery partner
                  collects payment on delivery.
                </p>
              </div>
              <Switch value={enabled} onValueChange={setEnabled} aria-label="Enable COD" />
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-gray-50 px-5 py-4">
            <p className="text-[14px] leading-6 text-gray-600">
              When a customer places a COD order, the order is confirmed immediately. Mark payment as
              received in the order detail after you collect cash.
            </p>
          </div>
        </>
      )}
      {dialog}
    </PaymentMethodConfigLayout>
  )
}
