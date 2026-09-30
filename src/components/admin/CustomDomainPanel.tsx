'use client'

import { Button } from '@/components/ui/Button'
import { getErrorMessage } from '@/core/lib/api-error'
import {
  deleteCustomDomain,
  fetchCustomDomain,
  saveCustomDomain,
  verifyCustomDomain,
  type CustomDomainView,
} from '@/core/api/stores'
import { useStore } from '@/providers/store-provider'
import { useCallback, useEffect, useState } from 'react'

function statusLabel(status: CustomDomainView['status']): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'pending':
      return 'Waiting for DNS'
    case 'failed':
      return 'Needs attention'
    default:
      return 'Not connected'
  }
}

export function CustomDomainPanel() {
  const { store, refreshStore } = useStore()
  const storeId = store?.id
  const [domainInput, setDomainInput] = useState('')
  const [view, setView] = useState<CustomDomainView | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!storeId) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCustomDomain(storeId)
      setView(data)
      if (data.custom_domain) setDomainInput(data.custom_domain)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load domain settings'))
    } finally {
      setLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    void load()
  }, [load])

  const run = async (fn: () => Promise<CustomDomainView>, success: string) => {
    if (!storeId) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const data = await fn()
      setView(data)
      if (data.custom_domain) setDomainInput(data.custom_domain)
      setNotice(success)
      await refreshStore()
    } catch (err) {
      setError(getErrorMessage(err, 'Domain update failed'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="px-5 py-4 text-[13px] text-gray-500">Loading domain settings…</p>
  }

  return (
    <div className="px-5 pb-4 pt-0">
      {error ? (
        <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>
      ) : null}
      {notice ? (
        <p className="mb-3 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800">{notice}</p>
      ) : null}

      <p className="mb-3 text-[13px] text-gray-500">
        Status: <span className="font-semibold text-ink">{statusLabel(view?.status ?? 'none')}</span>
      </p>

      {view?.status === 'active' && view.custom_domain ? (
        <p className="mb-3 text-[13px] leading-5 text-gray-500">
          Customers can open your store at{' '}
          <span className="font-semibold text-ink">https://{view.custom_domain}</span>. The AiShopy
          subdomain still works as a backup.
        </p>
      ) : (
        <>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Your domain
          </label>
          <input
            type="text"
            value={domainInput}
            onChange={(event) => setDomainInput(event.target.value)}
            placeholder="shop.yourbrand.com"
            className="mb-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-ink outline-none focus:border-ink"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </>
      )}

      {view?.custom_domain && view.status !== 'active' ? (
        <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] leading-5 text-gray-600">
          <p className="mb-1 font-semibold text-ink">Add this DNS record</p>
          <p>
            Type <span className="font-semibold">CNAME</span>
          </p>
          <p>
            Host <span className="font-semibold">{view.cname_host}</span>
          </p>
          <p>
            Value <span className="font-semibold">{view.cname_target}</span>
          </p>
          <p className="mt-2">Then tap Verify. SSL is issued automatically after DNS is correct.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {view?.status !== 'active' ? (
          <Button
            label={view?.custom_domain ? 'Save domain' : 'Connect domain'}
            loading={busy}
            onClick={() =>
              run(() => saveCustomDomain(storeId!, domainInput.trim()), 'Domain saved. Add the CNAME, then verify.')
            }
          />
        ) : null}
        {view?.custom_domain && view.status !== 'active' ? (
          <Button
            label="Verify DNS"
            variant="outline"
            loading={busy}
            onClick={() => run(() => verifyCustomDomain(storeId!), 'Checked DNS')}
          />
        ) : null}
        {view?.custom_domain ? (
          <Button
            label="Remove custom domain"
            variant="ghost"
            loading={busy}
            onClick={() => run(() => deleteCustomDomain(storeId!), 'Custom domain removed')}
          />
        ) : null}
      </div>
    </div>
  )
}
