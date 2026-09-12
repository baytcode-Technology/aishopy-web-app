import Link from 'next/link'

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Email OTP and Google sign-in will use the same backend as the mobile
        app. Auth is not wired yet.
      </p>
      <Link href="/" className="mt-6 text-sm font-medium text-brand-green">
        Back
      </Link>
    </main>
  )
}
