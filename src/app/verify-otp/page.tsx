'use client'

import { AuthButton } from '@/components/auth/AuthButton'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { getErrorMessage } from '@/core/lib/api-error'
import { useAuth } from '@/providers/auth-provider'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState, type FormEvent } from 'react'

function VerifyOtpForm() {
  const searchParams = useSearchParams()
  const emailValue = searchParams.get('email') ?? ''
  const { verifyOtp, sendOtp } = useAuth()
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const onVerify = async (event: FormEvent) => {
    event.preventDefault()
    const code = otp.trim()
    if (code.length < 6) {
      setError('Enter the 6-digit code from your email')
      return
    }
    if (!emailValue) {
      setError('Email is missing. Go back and try again.')
      return
    }

    setError('')
    setLoading(true)
    try {
      await verifyOtp(emailValue, code)
      router.replace('/store-check')
    } catch (e) {
      setError(getErrorMessage(e, 'Invalid code'))
      setLoading(false)
    }
  }

  const onResend = async () => {
    if (!emailValue) return
    setResending(true)
    setInfo('')
    try {
      await sendOtp(emailValue)
      setInfo('A new code has been sent to your email.')
    } catch (e) {
      setError(getErrorMessage(e, 'Could not resend OTP'))
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title="Enter code"
      subtitle={`We sent a verification code to ${emailValue || 'your email'}.`}
      footer={
        <Link href="/login" className="text-sm font-semibold text-gray-600 underline">
          Change email
        </Link>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={onVerify}>
        <AuthInput
          label="Verification code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
          placeholder="123456"
          inputMode="numeric"
          autoComplete="one-time-code"
          error={error}
        />
        {info ? <p className="text-sm text-gray-600">{info}</p> : null}
        <AuthButton label="Verify & continue" loading={loading} type="submit" />
        <AuthButton
          label={resending ? 'Sending…' : 'Resend code'}
          variant="outline"
          loading={resending}
          disabled={loading}
          onClick={onResend}
        />
      </form>
    </AuthLayout>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-100">
          <p className="text-sm text-gray-500">Loading…</p>
        </main>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  )
}
