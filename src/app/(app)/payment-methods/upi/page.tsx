'use client'

import { CategoryImagePicker } from '@/components/catalog/CategoryImagePicker'
import { PaymentMethodConfigLayout } from '@/components/store/PaymentMethodConfigLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PaymentMethodConfigSkeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { fetchPaymentConfig, updatePaymentConfig } from '@/core/api/payment-config'
import { getErrorMessage } from '@/core/lib/api-error'
import { useUnsavedChangesExit } from '@/hooks/useUnsavedChangesExit'
import { uploadProductImages } from '@/platform/upload-images'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

type UpiSavedSnapshot = {
  enabled: boolean
  vpa: string
  displayName: string
  qrUrl: string | null
}

export default function UpiPaymentPage() {
  const router = useRouter()
  const { store, role } = useStore()
  const [enabled, setEnabled] = useState(false)
  const [vpa, setVpa] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [qrPreview, setQrPreview] = useState<string | null>(null)
  const [saved, setSaved] = useState<UpiSavedSnapshot>({
    enabled: false,
    vpa: '',
    displayName: '',
    qrUrl: null,
  })
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

  const qrDisplayUri = qrPreview ?? qrUrl

  const isDirty = useMemo(() => {
    if (loading) return false
    return (
      enabled !== saved.enabled ||
      vpa.trim() !== saved.vpa ||
      displayName.trim() !== saved.displayName ||
      qrUrl !== saved.qrUrl ||
      qrFile !== null
    )
  }, [loading, enabled, saved, vpa, displayName, qrUrl, qrFile])

  const load = useCallback(async () => {
    if (!store?.id || role === 'staff') return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchPaymentConfig(store.id)
      const upi = res.data.payment_config.upi
      const nextSaved: UpiSavedSnapshot = {
        enabled: upi.enabled,
        vpa: upi.vpa ?? '',
        displayName: upi.display_name ?? '',
        qrUrl: upi.qr_image_url,
      }
      setEnabled(nextSaved.enabled)
      setVpa(nextSaved.vpa)
      setDisplayName(nextSaved.displayName)
      setQrUrl(nextSaved.qrUrl)
      setQrFile(null)
      setQrPreview(null)
      setSaved(nextSaved)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load UPI settings'))
    } finally {
      setLoading(false)
    }
  }, [store?.id, role])

  useEffect(() => {
    void load()
  }, [load])

  const pickQrImage = (file: File) => {
    setQrFile(file)
    setQrPreview(URL.createObjectURL(file))
  }

  const removeQrImage = () => {
    setQrFile(null)
    setQrPreview(null)
    setQrUrl(null)
  }

  const save = useCallback(async (): Promise<boolean> => {
    if (!store?.id) return false
    setSaving(true)
    setError(null)
    try {
      let nextQrUrl = qrUrl
      if (qrFile) {
        const [uploaded] = await uploadProductImages(store.id, [qrFile])
        nextQrUrl = uploaded ?? qrUrl
      }

      await updatePaymentConfig(store.id, {
        upi: {
          enabled,
          vpa: vpa.trim(),
          display_name: displayName.trim() || null,
          qr_image_url: nextQrUrl,
        },
      })

      const nextSaved: UpiSavedSnapshot = {
        enabled,
        vpa: vpa.trim(),
        displayName: displayName.trim(),
        qrUrl: nextQrUrl,
      }
      setSaved(nextSaved)
      setQrFile(null)
      setQrPreview(null)
      setQrUrl(nextQrUrl)
      setNotice('UPI settings saved')
      return true
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save UPI settings'))
      return false
    } finally {
      setSaving(false)
    }
  }, [store?.id, qrUrl, qrFile, enabled, vpa, displayName])

  const { requestBack, dialog } = useUnsavedChangesExit({
    isDirty,
    isLoading: loading,
    onSave: save,
  })

  if (role === 'staff') return null

  return (
    <PaymentMethodConfigLayout
      title="UPI"
      subtitle="Manual UPI collection"
      onBack={requestBack}
      footer={<Button label="Save" loading={saving} disabled={loading} onClick={() => void save()} />}
    >
      {notice ? <p className="text-sm font-semibold text-brand-green">{notice}</p> : null}
      {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}
      {loading ? (
        <PaymentMethodConfigSkeleton inputCount={2} showImageField showSecondCard />
      ) : (
        <>
          <div className="flex flex-col gap-4 rounded-[28px] border border-gray-200 bg-surface px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-4">
                <p className="text-[15px] font-semibold text-ink">Enable UPI</p>
                <p className="mt-1 text-xs text-gray-500">
                  Show your UPI ID and QR at checkout. Confirm payment manually in the app.
                </p>
              </div>
              <Switch value={enabled} onValueChange={setEnabled} aria-label="Enable UPI" />
            </div>

            <Input
              label="UPI ID (VPA) *"
              value={vpa}
              onChange={(e) => setVpa(e.target.value)}
              placeholder="mystore@paytm"
              autoCapitalize="none"
            />
            <Input
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="My Store"
            />

            <div>
              <p className="mb-2 text-[13px] font-bold tracking-wide text-gray-600">
                UPI QR image (optional)
              </p>
              {qrDisplayUri ? (
                <div className="flex flex-col items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDisplayUri}
                    alt="UPI QR"
                    className="h-44 w-44 rounded-xl border border-gray-200 bg-gray-50 object-contain"
                  />
                  <div className="flex gap-4">
                    <label className="cursor-pointer text-[13px] font-semibold text-blue-600">
                      Change image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          e.target.value = ''
                          if (file) pickQrImage(file)
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={removeQrImage}
                      className="text-[13px] font-semibold text-gray-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <CategoryImagePicker imageUri={null} onPick={pickQrImage} label="" />
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-gray-50 px-5 py-4">
            <p className="text-[14px] leading-6 text-gray-600">
              Customers pay you directly in PhonePe, Google Pay, or Paytm. You will see the order as
              awaiting UPI payment and can confirm once you receive the transfer.
            </p>
          </div>
        </>
      )}
      {dialog}
    </PaymentMethodConfigLayout>
  )
}
