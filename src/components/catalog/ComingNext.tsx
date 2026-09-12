type Props = {
  title: string
  body: string
}

export function ComingNext({ title, body }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col px-5 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-[15px] leading-6 text-gray-500">{body}</p>
      <p className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-surface px-4 py-5 text-sm font-semibold text-gray-500">
        Coming next
      </p>
    </main>
  )
}
