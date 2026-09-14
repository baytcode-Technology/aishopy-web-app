'use client'

import { RazorpayCheckout, type RazorpayPaymentResult } from '@/components/payments/RazorpayCheckout'
import { PaymentMethodConfigLayout } from '@/components/store/PaymentMethodConfigLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { PaymentMethodConfigSkeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import {
  fetchPaymentConfig,
  startRazorpaySetupTest,
  updatePaymentConfig,
  verifyRazorpaySetupTest,
  type RazorpaySetupTestCheckout,
} from '@/core/api/payment-config'
import { getErrorMessage } from '@/core/lib/api-error'
import { getRazorpayWebhookUrl, razorpayKeyMatchesMode } from '@/core/lib/razorpay-config'
import type { RazorpayMode } from '@/core/types/payment-config'
import { useUnsavedChangesExit } from '@/hooks/useUnsavedChangesExit'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

const RAZORPAY_DASHBOARD = 'https://dashboard.razorpay.com'

function testStatusLabel(
  testPassed: boolean,
  testPassedMode: RazorpayMode | null,
  mode: RazorpayMode,
): string {
  if (testPassed) {
    const envLabel = testPassedMode === 'live' ? 'live' : 'fake money'
    if (testPassedMode && testPassedMode !== mode) {
      return `Test passed (${envLabel}) — save ${mode} settings and re-test to enable`
    }
    return `Test passed (${envLabel})`
  }
  return 'Not tested for this environment'
}

export default function RazorpayPaymentPage() {
  const router = useRouter()
  const { store, role } = useStore()
  const [enabled, setEnabled] = useState(false)
  const [mode, setMode] = useState<RazorpayMode>('test')
  const [keyId, setKeyId] = useState('')
  const [keySecret, setKeySecret] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [maskedKey, setMaskedKey] = useState<string | null>(null)
  const [maskedWebhook, setMaskedWebhook] = useState<string | null>(null)
  const [testPassed, setTestPassed] = useState(false)
  const [testPassedMode, setTestPassedMode] = useState<RazorpayMode | null>(null)
  const [testRequired, setTestRequired] = useState(true)
  const [savedKeyId, setSavedKeyId] = useState('')
  const [savedMode, setSavedMode] = useState<RazorpayMode>('test')
  const [savedEnabled, setSavedEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [checkoutSession, setCheckoutSession] = useState<RazorpaySetupTestCheckout | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (role === 'staff') {
      setNotice('Only the store owner can change payment methods')
      router.back()
    }
  }, [role, router])

  const { url: webhookUrl, isProductionFallback } = getRazorpayWebhookUrl()

  const credentialsSavedOnServer = Boolean(maskedKey && maskedWebhook && savedKeyId)
  const credentialsDirty =
    keyId.trim() !== savedKeyId ||
    mode !== savedMode ||
    Boolean(keySecret.trim()) ||
    Boolean(webhookSecret.trim())
  const testPassedForCurrentEnv = testPassed && (testPassedMode === null || testPassedMode === mode)
  const testOk = !testRequired || testPassedForCurrentEnv
  const canEnable = testOk && credentialsSavedOnServer && !credentialsDirty
  const canRunTest = credentialsSavedOnServer && !credentialsDirty && !testing && !saving

  const enableHint = (() => {
    if (!credentialsSavedOnServer) return 'Save your Razorpay keys and webhook secret first.'
    if (credentialsDirty) return 'Save your latest settings before enabling or testing.'
    if (!testPassedForCurrentEnv) return 'Run the ₹1 test payment for this environment first.'
    if (!enabled) return 'Turn on, then tap Save to show Razorpay on your storefront.'
    return 'Razorpay is enabled on your storefront checkout.'
  })()

  const isDirty = useMemo(() => {
    if (loading) return false
    return (
      enabled !== savedEnabled ||
      keyId.trim() !== savedKeyId ||
      mode !== savedMode ||
      Boolean(keySecret.trim()) ||
      Boolean(webhookSecret.trim())
    )
  }, [
    loading,
    enabled,
    savedEnabled,
    keyId,
    savedKeyId,
    mode,
    savedMode,
    keySecret,
    webhookSecret,
  ])

  const checkoutForModal = useMemo(() => {
    if (!checkoutSession) return null
    return {
      key_id: checkoutSession.key_id,
      order_id: checkoutSession.razorpay_order_id,
      amount: checkoutSession.amount,
      currency: checkoutSession.currency,
      store_name: checkoutSession.store_name,
    }
  }, [checkoutSession])

  const load = useCallback(async () => {
    if (!store?.id || role === 'staff') return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchPaymentConfig(store.id)
      const rz = res.data.payment_config.razorpay
      setEnabled(rz.enabled)
      setMode(rz.mode)
      setKeyId(rz.key_id ?? '')
      setSavedKeyId(rz.key_id ?? '')
      setSavedMode(rz.mode)
      setSavedEnabled(rz.enabled)
      setMaskedKey(rz.key_secret_masked)
      setMaskedWebhook(rz.webhook_secret_masked)
      setTestPassed(rz.test_passed)
      setTestPassedMode(rz.test_passed_mode)
      setTestRequired(rz.test_required)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load Razorpay settings'))
    } finally {
      setLoading(false)
    }
  }, [store?.id, role])

  useEffect(() => {
    void load()
  }, [load])

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setNotice('Webhook URL copied')
    } catch {
      window.prompt('Copy webhook URL', webhookUrl)
    }
  }

  const openDashboard = (path: string) => {
    window.open(`${RAZORPAY_DASHBOARD}${path}`, '_blank', 'noopener,noreferrer')
  }

  const save = useCallback(async (): Promise<boolean> => {
    if (!store?.id) return false
    const wantsEnableOnStorefront = enabled
    const canEnableNow = wantsEnableOnStorefront && canEnable
    const savingCredentialsOnly =
      wantsEnableOnStorefront && !canEnable && (credentialsDirty || !testPassedForCurrentEnv)

    if (wantsEnableOnStorefront && !canEnable && !savingCredentialsOnly) {
      setError('Run the ₹1 test payment for this environment before enabling Razorpay')
      return false
    }

    const persistEnabled = canEnableNow
    const mustValidateKeys =
      persistEnabled || savingCredentialsOnly || credentialsDirty || Boolean(keyId.trim())

    if (mustValidateKeys) {
      if (!keyId.trim()) {
        setError('Key ID is required')
        return false
      }
      const keyModeError = razorpayKeyMatchesMode(keyId, mode)
      if (keyModeError) {
        setError(keyModeError)
        return false
      }
      if ((persistEnabled || savingCredentialsOnly) && !keySecret.trim() && !maskedKey) {
        setError('Key secret is required when Razorpay is enabled')
        return false
      }
      if ((persistEnabled || savingCredentialsOnly) && !webhookSecret.trim() && !maskedWebhook) {
        setError('Webhook secret is required when Razorpay is enabled')
        return false
      }
    }

    setSaving(true)
    setError(null)
    try {
      await updatePaymentConfig(store.id, {
        razorpay: {
          enabled: persistEnabled,
          key_id: keyId.trim() || undefined,
          key_secret: keySecret.trim() || undefined,
          webhook_secret: webhookSecret.trim() || undefined,
          mode,
        },
      })
      setKeySecret('')
      setWebhookSecret('')
      if (savingCredentialsOnly) {
        setEnabled(false)
        setNotice(
          mode === 'live'
            ? 'Live settings saved. Run the ₹1 test, then turn on Enable.'
            : 'Settings saved. Run the ₹1 test, then turn on Enable.',
        )
      } else {
        setNotice('Razorpay settings saved')
      }
      await load()
      return true
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save Razorpay settings'))
      return false
    } finally {
      setSaving(false)
    }
  }, [
    enabled,
    keyId,
    mode,
    keySecret,
    maskedKey,
    webhookSecret,
    maskedWebhook,
    canEnable,
    credentialsDirty,
    testPassedForCurrentEnv,
    load,
    store?.id,
  ])

  const { requestBack, dialog } = useUnsavedChangesExit({
    isDirty,
    isLoading: loading,
    onSave: save,
  })

  const runSetupTest = async () => {
    if (!store?.id) return
    if (!canRunTest) {
      setError('Save your Razorpay settings before running the test')
      return
    }

    setTesting(true)
    setError(null)
    try {
      const res = await startRazorpaySetupTest(store.id)
      setCheckoutSession(res.data)
      setCheckoutOpen(true)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not start Razorpay test'))
    } finally {
      setTesting(false)
    }
  }

  const handleTestSuccess = async (payment: RazorpayPaymentResult) => {
    if (!checkoutSession || !store?.id) return

    setTesting(true)
    try {
      const res = await verifyRazorpaySetupTest(store.id, {
        order_id: checkoutSession.order_id,
        checkout_token: checkoutSession.checkout_token,
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      })
      setCheckoutOpen(false)
      setCheckoutSession(null)
      if (!res.data.test_passed) {
        setError(
          'Payment received but Razorpay test was not confirmed. Try again or contact support.',
        )
        await load()
        return
      }
      setTestPassed(res.data.test_passed)
      setTestPassedMode(res.data.test_passed_mode)
      setNotice('Razorpay test passed. Turn on Enable, then tap Save.')
      await load()
    } catch (e) {
      setError(getErrorMessage(e, 'Payment received but verification failed'))
    } finally {
      setTesting(false)
    }
  }

  const handleTestDismiss = () => {
    setCheckoutOpen(false)
    setCheckoutSession(null)
  }

  const handleEnableToggle = (value: boolean) => {
    if (value && !canEnable) {
      setError('Run the ₹1 test payment for this environment before enabling Razorpay')
      return
    }
    setEnabled(value)
  }

  if (role === 'staff') return null

  return (
    <PaymentMethodConfigLayout
      title="Razorpay"
      subtitle="Cards, wallets & netbanking"
      onBack={requestBack}
      footer={
        <div className="flex flex-col gap-2">
          {credentialsDirty ? (
            <p className="px-1 text-center text-xs text-gray-500">
              Save your {mode} settings first — then the ₹1 test button unlocks.
            </p>
          ) : null}
          <Button
            label={
              mode === 'test' ? 'Test Razorpay (₹1, fake money)' : 'Test Razorpay (₹1, real money)'
            }
            variant="outline"
            loading={testing}
            disabled={!canRunTest || loading}
            onClick={() => void runSetupTest()}
          />
          <Button label="Save" loading={saving} disabled={loading} onClick={() => void save()} />
        </div>
      }
    >
      {notice ? <p className="text-sm font-semibold text-brand-green">{notice}</p> : null}
      {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}
      {loading ? (
        <PaymentMethodConfigSkeleton inputCount={3} showStatusBanner showSecondCard />
      ) : (
        <>
          <div className="flex w-full flex-col gap-4 rounded-[28px] border border-gray-200 bg-surface px-4 py-5 shadow-sm">
            <div
              className={`rounded-xl border px-3 py-2.5 ${
                testPassedForCurrentEnv
                  ? 'border-brand-green bg-[#E8F8EC]'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <p
                className={`text-[13px] font-semibold ${
                  testPassedForCurrentEnv ? 'text-brand-green' : 'text-ink'
                }`}
              >
                {testStatusLabel(testPassed, testPassedMode, mode)}
              </p>
              <p
                className={`mt-1 text-xs leading-5 ${
                  testPassedForCurrentEnv ? 'text-brand-green' : 'text-gray-500'
                }`}
              >
                {testPassedForCurrentEnv
                  ? 'Razorpay is verified for this environment. Turn on Enable, then tap Save.'
                  : mode === 'test'
                    ? 'Use test card 4111 1111 1111 1111 after saving settings.'
                    : 'You pay yourself ₹1 to verify your live Razorpay account.'}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[15px] font-semibold text-ink">Enable Razorpay</p>
                <p className="mt-1 text-xs text-gray-500">{enableHint}</p>
              </div>
              <Switch
                value={enabled}
                onValueChange={handleEnableToggle}
                aria-label="Enable Razorpay"
              />
            </div>

            <div className="w-full">
              <p className="mb-2 text-[13px] font-bold tracking-wide text-gray-600">Environment</p>
              <div className="flex w-full overflow-hidden rounded-xl border border-gray-200">
                {(['test', 'live'] as RazorpayMode[]).map((item, index) => {
                  const active = mode === item
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setMode(item)
                        if (testPassedMode && testPassedMode !== item) {
                          setEnabled(false)
                        }
                      }}
                      className={`flex min-w-0 flex-1 items-center justify-center py-3 ${
                        active ? 'bg-brand-primary' : 'bg-surface'
                      } ${index > 0 ? 'border-l border-gray-200' : ''}`}
                    >
                      <span
                        className={`text-[14px] font-semibold ${
                          active ? 'text-brand-on-primary' : 'text-ink'
                        }`}
                      >
                        {item === 'test' ? 'Test' : 'Live'}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                {mode === 'test'
                  ? 'Test mode uses fake money (rzp_test_... keys).'
                  : 'Live mode uses real money (rzp_live_... keys) after Razorpay verifies your business.'}
              </p>
            </div>

            <Input
              label="Key ID"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder={mode === 'test' ? 'rzp_test_...' : 'rzp_live_...'}
              autoCapitalize="none"
            />
            <Input
              label="Key Secret"
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              placeholder={maskedKey ? `Saved ${maskedKey}` : 'Enter key secret'}
              type="password"
              autoCapitalize="none"
            />
            <Input
              label="Webhook secret"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={maskedWebhook ? `Saved ${maskedWebhook}` : 'Enter webhook secret'}
              type="password"
              autoCapitalize="none"
            />
            <p className="-mt-2 text-xs text-gray-500">
              Key secret and webhook secret stay on our server. Your storefront only uses the public Key
              ID.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-[28px] border border-gray-200 bg-gray-50 px-5 py-4">
            <p className="text-[13px] font-bold text-ink">Setup in Razorpay Dashboard</p>
            <p className="text-[14px] leading-6 text-gray-600">
              1. Sign up at Razorpay and complete business verification there (not in this app).
              <br />
              2. Switch Razorpay Dashboard to {mode === 'test' ? 'Test' : 'Live'} mode (top bar).
              <br />
              3. Copy API keys from Dashboard → Developers → API Keys.
              <br />
              4. Add the webhook URL below under Developers → Webhooks.
              <br />
              5. Enable payment.captured (required). Optionally enable payment.failed.
              <br />
              6. Paste the webhook secret here, save, then run the ₹1 test.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openDashboard('/app/keys')}
                className="rounded-full border border-gray-200 bg-surface px-3 py-2 text-[13px] font-semibold text-blue-600"
              >
                Open API Keys
              </button>
              <button
                type="button"
                onClick={() => openDashboard('/app/webhooks')}
                className="rounded-full border border-gray-200 bg-surface px-3 py-2 text-[13px] font-semibold text-blue-600"
              >
                Open Webhooks
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-[13px] font-semibold text-ink">Webhook URL</p>
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 font-mono text-[12px] leading-5 text-ink">{webhookUrl}</p>
                <button
                  type="button"
                  onClick={() => void copyWebhookUrl()}
                  aria-label="Copy webhook URL"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-surface text-brand-primary"
                >
                  <MenuIcon name="copy" className="h-3.5 w-3.5" />
                </button>
              </div>
              {isProductionFallback ? (
                <p className="text-xs text-gray-500">
                  Using production API URL. Set NEXT_PUBLIC_API_URL if you need a different host.
                </p>
              ) : null}
            </div>
          </div>

          <RazorpayCheckout
            open={checkoutOpen}
            checkout={checkoutForModal}
            description="Razorpay connection test — ₹1"
            onSuccess={(payment) => void handleTestSuccess(payment)}
            onDismiss={handleTestDismiss}
          />
        </>
      )}
      {dialog}
    </PaymentMethodConfigLayout>
  )
}
