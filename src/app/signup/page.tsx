'use client'

import { AuthButton } from '@/components/auth/AuthButton'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Divider } from '@/components/auth/Divider'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { getErrorMessage } from '@/core/lib/api-error'
import { useAuth } from '@/providers/auth-provider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'

export default function SignupPage() {
  const { sendOtp, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/store-check')
    }
  }, [isAuthenticated, isLoading, router])

  const onContinue = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email address')
      return
    }

    setError('')
    setLoading(true)
    try {
      await sendOtp(trimmed)
      router.push(`/verify-otp?email=${encodeURIComponent(trimmed)}`)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not send OTP'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Enter your email to get started. We will send you a verification code."
      footer={
        <p className="text-center text-sm font-medium text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-ink underline">
            Sign in
          </Link>
        </p>
      }
    >
      <GoogleButton />
      {process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ? <Divider /> : null}
      <form className="flex flex-col gap-5" onSubmit={onContinue}>
        <AuthInput
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          error={error}
        />
        <AuthButton
          label="Continue"
          loading={loading}
          type="submit"
          className="border-brand-green bg-brand-green"
          style={{
            backgroundColor: 'var(--color-brand-green)',
            borderColor: 'var(--color-brand-green)',
            color: 'var(--color-brand-on-primary)',
          }}
        />
      </form>
    </AuthLayout>
  )
}
