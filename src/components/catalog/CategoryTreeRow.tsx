import { PRODUCT_STATUS_THEME } from '@/core/lib/product-status'
import type { Category } from '@/core/types/category'
import Link from 'next/link'

type Props = {
  category: Category
  depth?: number
  hasChildren?: boolean
  childCount?: number
  expanded?: boolean
  breadcrumb?: string
  onToggleExpand?: () => void
}

export function CategoryTreeRow({
  category,
  depth = 0,
  hasChildren = false,
  childCount = 0,
  expanded = false,
  breadcrumb,
  onToggleExpand,
}: Props) {
  const count = category.product_count ?? 0
  const countLabel =
    hasChildren && count === 0
      ? `${childCount} subcategories`
      : count === 1
        ? '1 product'
        : `${count} products`
  const theme = PRODUCT_STATUS_THEME[category.is_active ? 'active' : 'unlisted']

  return (
    <div
      className="flex items-center gap-2 border-b border-gray-200 py-3.5"
      style={{ paddingLeft: depth * 20 }}
    >
      {hasChildren ? (
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[12px] font-bold text-gray-500"
        >
          {expanded ? '▾' : '▸'}
        </button>
      ) : (
        <span className="w-7" />
      )}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        {category.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={category.image_url} alt="" className="h-11 w-11 object-cover" />
        ) : (
          <span className="text-[11px] font-bold text-gray-400">—</span>
        )}
      </div>
      <Link href={`/products/categories/${category.id}`} className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{category.name}</p>
        <p className="mt-0.5 truncate text-[13px] text-gray-500">{breadcrumb ?? countLabel}</p>
      </Link>
      <span
        className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
        style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
      >
        {theme.label}
      </span>
    </div>
  )
}
