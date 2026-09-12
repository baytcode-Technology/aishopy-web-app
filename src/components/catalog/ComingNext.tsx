import { CatalogHeader } from '@/components/catalog/CatalogHeader'

type Props = {
  title: string
  body: string
}

export function ComingNext({ title, body }: Props) {
  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader title={title} />
      <div className="px-5 py-6">
        <p className="text-[15px] leading-6 text-gray-500">{body}</p>
        <p className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-surface px-4 py-5 text-sm font-semibold text-gray-500">
          Coming next
        </p>
      </div>
    </main>
  )
}
