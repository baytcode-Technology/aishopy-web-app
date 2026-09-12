import { DetailHeader } from '@/components/catalog/DetailHeader'
import { DetailSection } from '@/components/catalog/DetailSection'

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div aria-hidden className={`animate-pulse rounded-2xl bg-gray-200 ${className}`} />
}

export function ProductListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-gray-200 py-3.5">
      <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <Skeleton className="mb-2 h-3.5 w-[70%] rounded-md" />
        <Skeleton className="h-3 w-[45%] rounded-md" />
      </div>
      <Skeleton className="h-6 w-14 shrink-0 rounded-full" />
    </div>
  )
}

export function ProductListSkeleton({ count = 7 }: { count?: number }) {
  return (
    <div className="pt-1">
      {Array.from({ length: count }, (_, index) => (
        <ProductListRowSkeleton key={index} />
      ))}
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <main className="min-h-full bg-gray-100 pb-10">
      <DetailHeader title={<Skeleton className="mx-auto h-4 w-36 rounded-md" />} backHref="/products" />
      <div className="flex flex-col gap-3 px-5 pt-4">
        <DetailSection className="p-4">
          <Skeleton className="mb-3 h-4 w-16 rounded-md" />
          <div className="flex gap-2.5 overflow-hidden">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-[88px] w-[88px] shrink-0 rounded-xl" />
            ))}
          </div>
        </DetailSection>

        <DetailSection className="flex items-center justify-between px-3.5 py-2.5">
          <div className="min-w-0 flex-1 pr-3">
            <Skeleton className="mb-1.5 h-2.5 w-14 rounded-md" />
            <Skeleton className="h-3.5 w-40 rounded-md" />
          </div>
          <Skeleton className="h-8 w-14 rounded-full" />
        </DetailSection>

        <DetailSection className="p-3">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-16 rounded-full" />
            <Skeleton className="h-9 w-16 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </DetailSection>

        <DetailSection className="relative p-3.5">
          <Skeleton className="absolute right-2.5 top-2.5 h-8 w-8 rounded-full" />
          <Skeleton className="mb-2 h-2.5 w-24 rounded-md" />
          <Skeleton className="mb-2 h-5 w-[80%] rounded-md" />
          <Skeleton className="mb-3 h-4 w-24 rounded-md" />
          <div className="mb-3 flex gap-2">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
          </div>
          <Skeleton className="mb-2 h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-[70%] rounded-md" />
        </DetailSection>

        <DetailSection className="flex items-center justify-between px-3.5 py-2.5">
          <Skeleton className="h-3.5 w-28 rounded-md" />
          <Skeleton className="h-3.5 w-4 rounded-md" />
        </DetailSection>
      </div>
    </main>
  )
}

export function CategoryDetailSkeleton() {
  return (
    <main className="min-h-full bg-gray-100 pb-28">
      <DetailHeader
        title={<Skeleton className="mx-auto h-4 w-28 rounded-md" />}
        backHref="/products/categories"
        right={
          <>
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </>
        }
      />
      <div className="px-5 pt-5">
        <div className="relative mb-4 overflow-hidden rounded-[20px] border border-gray-200 bg-surface">
          <div className="px-4 pb-3 pt-4">
            <Skeleton className="mb-3 h-4 w-24 rounded-md" />
            <Skeleton className="h-[180px] w-full rounded-2xl" />
          </div>
        </div>

        <Skeleton className="mb-4 h-6 w-16 rounded-full" />

        <DetailSection className="relative mb-4 p-4">
          <Skeleton className="absolute right-3 top-3 h-9 w-9 rounded-full" />
          <Skeleton className="mb-4 h-6 w-[60%] rounded-md" />
          <div className="mb-4 flex gap-3">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
          </div>
          <Skeleton className="mb-2 h-3.5 w-12 rounded-md" />
          <Skeleton className="mb-2 h-3.5 w-full rounded-md" />
          <Skeleton className="h-3.5 w-[80%] rounded-md" />
        </DetailSection>

        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-3 w-28 rounded-md" />
            <Skeleton className="h-3 w-6 rounded-md" />
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 px-3">
            <ProductListRowSkeleton />
            <ProductListRowSkeleton />
          </div>
        </section>

        <section className="-mx-5 mb-6">
          <div className="flex items-center border-y border-gray-100 bg-gray-50 px-5 py-3.5">
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>
          <div className="px-5">
            <ProductListRowSkeleton />
            <ProductListRowSkeleton />
            <ProductListRowSkeleton />
          </div>
        </section>
      </div>
    </main>
  )
}
