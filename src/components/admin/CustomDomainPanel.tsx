'use client'

import { Button } from '@/components/ui/Button'
import { getErrorMessage } from '@/core/lib/api-error'
import {
  deleteCustomDomain,
  fetchCustomDomain,
  saveCustomDomain,
  setPublicLinkHost,
  verifyCustomDomain,
  type CustomDomainStatus,
  type CustomDomainView,
} from '@/core/api/stores'
import { useStore } from '@/providers/store-provider'
import { useCallback, useEffect, useState } from 'react'

const STEPS = ['Enter', 'Save', 'DNS', 'Active'] as const

type BusyAction = 'save' | 'verify' | 'remove' | 'link'

function statusLabel(status: CustomDomainStatus | undefined): string {
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

function statusChipClass(status: CustomDomainStatus | undefined): string {
  switch (status) {
    case 'active':
      return 'bg-success-bg text-success ring-success-border'
    case 'pending':
      return 'bg-warning-bg text-warning ring-gray-200'
    case 'failed':
      return 'bg-danger-bg text-danger ring-danger-border'
    default:
      return 'bg-gray-100 text-gray-600 ring-gray-200'
  }
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-surface px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
        <p className="truncate font-mono text-[14px] font-semibold text-ink">{value}</p>
      </div>
      <button
        type="button"
        className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-[12px] font-semibold text-ink"
        onClick={() => {
          void navigator.clipboard.writeText(value).then(() => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
          })
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function currentStepIndex(view: CustomDomainView | null, domainInput: string): number {
  if (view?.status === 'active') return 3
  if (!view?.custom_domain) return domainInput.trim() ? 1 : 0
  return 2
}

function DomainSteps({
  dnsType,
  dnsName,
  dnsValue,
}: {
  dnsType: string
  dnsName: string
  dnsValue: string
}) {
  const showParked = dnsType === 'A' && dnsName === '@'
  const steps = [
    'Open the place where you bought the domain.',
    ...(showParked
      ? ['Delete the row that says A, @, Parked. Leave every other row.']
      : []),
    'Add this record if it is not already there.',
    'Come back here and tap Verify.',
  ]
  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-100 px-4 py-4">
      <ol className="space-y-3">
        {steps.map((text, index) => (
          <li key={text} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface text-[11px] font-semibold text-ink">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-5 text-ink">{text}</p>
              {text.startsWith('Add this record') ? (
                <div className="mt-2 space-y-2">
                  <CopyRow label="Type" value={dnsType} />
                  <CopyRow label="Name" value={dnsName} />
                  <CopyRow label="Value" value={dnsValue} />
                  <p className="text-[12px] leading-5 text-gray-600">Leave TTL as it is.</p>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function CustomDomainPanel() {
  const { store, refreshStore } = useStore()
  const storeId = store?.id
  const [domainInput, setDomainInput] = useState('')
  const [view, setView] = useState<CustomDomainView | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<BusyAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [noticeTone, setNoticeTone] = useState<'ok' | 'warn'>('ok')

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

  const run = async (
    action: BusyAction,
    fn: () => Promise<CustomDomainView>,
    success: string | ((data: CustomDomainView) => { text: string; tone: 'ok' | 'warn' }),
  ) => {
    if (!storeId || busy) return
    setBusy(action)
    setError(null)
    setNotice(null)
    try {
      const data = await fn()
      setView(data)
      if (data.custom_domain) setDomainInput(data.custom_domain)
      else setDomainInput('')
      const result = typeof success === 'function' ? success(data) : { text: success, tone: 'ok' as const }
      setNotice(result.text)
      setNoticeTone(result.tone)
      await refreshStore()
    } catch (err) {
      setError(getErrorMessage(err, 'Domain update failed'))
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return <p className="px-5 py-4 text-[13px] text-gray-500">Loading domain settings…</p>
  }

  const step = currentStepIndex(view, domainInput)
  const isActive = view?.status === 'active'
  const savedDomain = view?.custom_domain ?? ''
  const inputChanged = domainInput.trim().toLowerCase() !== savedDomain.toLowerCase()
  const showSave = !isActive && (!savedDomain || inputChanged)
  const showVerify = Boolean(savedDomain) && !isActive && !inputChanged

  return (
    <div className="px-5 pb-5 pt-4">
      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((label, index) => {
          const done = index < step || isActive
          const current = index === step && !isActive
          return (
            <li key={label} className="min-w-0">
              <div
                className={`h-1 rounded-full ${
                  done || current ? 'bg-brand-primary' : 'bg-gray-200'
                }`}
              />
              <p
                className={`mt-2 truncate text-[11px] font-semibold uppercase tracking-wide ${
                  current ? 'text-ink' : done ? 'text-brand-primary' : 'text-gray-400'
                }`}
              >
                {index + 1}. {label}
              </p>
            </li>
          )
        })}
      </ol>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[17px] font-semibold text-ink">{STEPS[step]}</h3>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ${statusChipClass(view?.status)}`}
        >
          {statusLabel(view?.status)}
        </span>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl bg-danger-bg px-4 py-3 text-[13px] text-danger ring-1 ring-danger-border">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          className={`mt-3 rounded-xl px-4 py-3 text-[13px] ring-1 ${
            noticeTone === 'warn'
              ? 'bg-warning-bg text-warning ring-gray-200'
              : 'bg-success-bg text-success ring-success-border'
          }`}
        >
          {notice}
        </p>
      ) : null}

      {isActive && view?.custom_domain ? (
        <div className="mt-4 rounded-2xl bg-success-bg px-4 py-4 ring-1 ring-success-border">
          <p className="text-[13px] font-medium text-success">Your store is live at</p>
          <p className="mt-1 break-all text-[16px] font-semibold text-success">
            https://{view.custom_domain}
          </p>
          <p className="mt-2 text-[13px] leading-5 text-gray-600">
            Your AiShopy subdomain still works as a backup.
          </p>
          <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Link to share
          </p>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
            {(
              [
                ['custom', 'Custom domain'],
                ['subdomain', 'AiShopy link'],
              ] as const
            ).map(([value, label]) => {
              const selected = (view.public_link_host ?? 'custom') === value
              return (
                <button
                  key={value}
                  type="button"
                  disabled={Boolean(busy) || selected}
                  onClick={() =>
                    void run(
                      'link',
                      () => setPublicLinkHost(storeId!, value),
                      value === 'custom'
                        ? 'Share links now use your custom domain.'
                        : 'Share links now use your AiShopy link.',
                    )
                  }
                  className={`rounded-lg px-3 py-2.5 text-[13px] font-semibold disabled:opacity-100 ${
                    selected ? 'bg-ink text-brand-on-primary' : 'text-ink'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[13px] leading-5 text-gray-600">
            {(view.public_link_host ?? 'custom') === 'subdomain'
              ? `https://${view.custom_domain} still opens your store.`
              : `${view.subdomain} still opens your store.`}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Your domain
          </label>
          <input
            type="text"
            value={domainInput}
            onChange={(event) => setDomainInput(event.target.value)}
            placeholder="shop.yourbrand.com"
            className="w-full rounded-xl border border-gray-200 bg-surface px-4 py-3 text-[15px] text-ink outline-none focus:border-ink"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      )}

      {view?.custom_domain && !isActive ? (
        <DomainSteps
          dnsType={view.dns_type ?? 'CNAME'}
          dnsName={view.dns_name ?? view.cname_host}
          dnsValue={view.dns_value ?? view.cname_target}
        />
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        {showSave ? (
          <Button
            label="Save domain"
            loading={busy === 'save'}
            disabled={Boolean(busy) || !domainInput.trim()}
            onClick={() =>
              run(
                'save',
                () => saveCustomDomain(storeId!, domainInput.trim()),
                'Domain saved. Add the record below, then verify.',
              )
            }
          />
        ) : null}
        {showVerify ? (
          <Button
            label="Verify domain"
            loading={busy === 'verify'}
            disabled={Boolean(busy)}
            onClick={() =>
              run('verify', () => verifyCustomDomain(storeId!), (data) =>
                data.status === 'active'
                  ? { text: 'Your domain is live.', tone: 'ok' }
                  : {
                      text: 'The DNS record was not found yet. Add it, then verify again.',
                      tone: 'warn',
                    },
              )
            }
          />
        ) : null}
        {view?.custom_domain ? (
          <Button
            label="Remove domain"
            variant="destructive"
            loading={busy === 'remove'}
            disabled={Boolean(busy)}
            onClick={() => run('remove', () => deleteCustomDomain(storeId!), 'Custom domain removed')}
          />
        ) : null}
      </div>
    </div>
  )
}
