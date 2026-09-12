import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-brand-green">app.aishopy.io</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">AiShopy</h1>
      <p className="mt-3 text-zinc-600">
        Merchant web app. Log in or create a store here, then use the same
        account in the Android and iOS apps.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg bg-brand-green px-4 py-2.5 text-sm font-medium text-white"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium"
        >
          Create store
        </Link>
      </div>
    </main>
  )
}
