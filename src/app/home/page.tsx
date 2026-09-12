'use client'

import { RequireAuth } from '@/components/auth/RequireAuth'
import { AppLogo } from '@/components/brand/AppLogo'
import { Button } from '@/components/ui/Button'
import { env } from '@/core/config/env'
import { useAuth } from '@/providers/auth-provider'
import { useStore } from '@/providers/store-provider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function HomeContent() {
  const { user, signOut } = useAuth()
  const { store, subdomainUrl, clearStore } = useStore()
  const router = useRouter()

  const handleSignOut = async () => {
    await clearStore()
    await signOut()
    router.replace('/login')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <AppLogo />
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">You&apos;re in</h1>
      <p className="mt-3 text-gray-600">
        {store
          ? `${store.name} is ready. Products, orders, and inbox come next.`
          : 'Products, orders, and inbox come next.'}
      </p>
      {user?.email ? (
        <p className="mt-2 text-sm text-gray-500">Signed in as {user.email}</p>
      ) : null}
      {store ? (
        <p className="mt-4 text-sm text-gray-500">
          Shop URL:{' '}
          <a
            href={subdomainUrl ?? `https://${store.slug}.${env.storefrontBaseDomain}`}
            className="font-medium text-brand-green underline"
            target="_blank"
            rel="noreferrer"
          >
            {store.slug}.{env.storefrontBaseDomain}
          </a>
        </p>
      ) : null}
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/create-store" className="text-sm font-semibold text-brand-green">
          Create another store
        </Link>
        <Link href="/select-store" className="text-sm font-semibold text-ink underline">
          Switch store
        </Link>
        <Button label="Sign out" variant="ghost" onClick={() => void handleSignOut()} />
      </div>
    </main>
  )
}

export default function HomePage() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  )
}
