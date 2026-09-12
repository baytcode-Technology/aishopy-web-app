import Link from 'next/link'

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Create store</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Sign up and store creation will be added next, matching the Expo
        create-store flow.
      </p>
      <Link href="/" className="mt-6 text-sm font-medium text-brand-green">
        Back
      </Link>
    </main>
  )
}
