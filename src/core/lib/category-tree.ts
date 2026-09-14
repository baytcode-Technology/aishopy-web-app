import type { Category } from '@/core/types/category'

export type CategoryTreeNode = Category & {
  children: CategoryTreeNode[]
}

export type FlatCategoryItem = {
  category: Category
  depth: number
  hasChildren: boolean
  childCount: number
}

export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const map = new Map<number, CategoryTreeNode>()
  const roots: CategoryTreeNode[] = []

  for (const category of categories) {
    map.set(category.id, { ...category, children: [] })
  }

  for (const category of categories) {
    const node = map.get(category.id)
    if (!node) continue
    if (category.parent_id != null && map.has(category.parent_id)) {
      map.get(category.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortNodes = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    for (const node of nodes) sortNodes(node.children)
  }
  sortNodes(roots)
  return roots
}

export function flattenCategoryTree(
  roots: CategoryTreeNode[],
  expandedIds: Set<number>,
  depth = 0,
): FlatCategoryItem[] {
  const result: FlatCategoryItem[] = []
  for (const node of roots) {
    result.push({
      category: node,
      depth,
      hasChildren: node.children.length > 0,
      childCount: node.children.length,
    })
    if (node.children.length > 0 && expandedIds.has(node.id)) {
      result.push(...flattenCategoryTree(node.children, expandedIds, depth + 1))
    }
  }
  return result
}

export function getCategoryBreadcrumb(categoryId: number, categories: Category[]): string {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const parts: string[] = []
  let current: Category | undefined = byId.get(categoryId)
  const seen = new Set<number>()
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    parts.unshift(current.name)
    current = current.parent_id != null ? byId.get(current.parent_id) : undefined
  }
  return parts.join(' › ')
}

export function getDirectChildren(parentId: number | null, categories: Category[]): Category[] {
  return categories
    .filter((c) => (c.parent_id ?? null) === parentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
}

export function getDescendantIds(categoryId: number, categories: Category[]): Set<number> {
  const byParent = new Map<number, number[]>()
  for (const c of categories) {
    if (c.parent_id == null) continue
    const list = byParent.get(c.parent_id) ?? []
    list.push(c.id)
    byParent.set(c.parent_id, list)
  }
  const result = new Set<number>()
  const stack = [...(byParent.get(categoryId) ?? [])]
  while (stack.length > 0) {
    const id = stack.pop()!
    if (result.has(id)) continue
    result.add(id)
    stack.push(...(byParent.get(id) ?? []))
  }
  return result
}

export function getAncestorIds(categoryId: number, categories: Category[]): Set<number> {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const result = new Set<number>()
  let current = byId.get(categoryId)?.parent_id ?? null
  const seen = new Set<number>()
  while (current != null && !seen.has(current)) {
    seen.add(current)
    result.add(current)
    current = byId.get(current)?.parent_id ?? null
  }
  return result
}

export function getAttachableCategories(parentId: number, categories: Category[]): Category[] {
  const blocked = getDescendantIds(parentId, categories)
  blocked.add(parentId)
  for (const id of getAncestorIds(parentId, categories)) {
    blocked.add(id)
  }
  return categories.filter((c) => !blocked.has(c.id)).sort((a, b) => a.name.localeCompare(b.name))
}

export function filterCategoriesForTree(
  categories: Category[],
  options: {
    search?: string
    status?: 'all' | 'active' | 'unlisted'
  },
): Category[] {
  const q = options.search?.trim().toLowerCase() ?? ''
  const status = options.status ?? 'all'

  const matches = (c: Category) => {
    const matchesSearch = !q || c.name.toLowerCase().includes(q)
    const matchesStatus =
      status === 'all' || (status === 'active' ? c.is_active : !c.is_active)
    return matchesSearch && matchesStatus
  }

  if (!q && status === 'all') return categories

  const byId = new Map(categories.map((c) => [c.id, c]))
  const included = new Set<number>()

  for (const c of categories) {
    if (!matches(c)) continue
    included.add(c.id)
    let parentId = c.parent_id
    while (parentId != null) {
      included.add(parentId)
      parentId = byId.get(parentId)?.parent_id ?? null
    }
  }

  return categories.filter((c) => included.has(c.id))
}

export function defaultExpandedIds(roots: CategoryTreeNode[]): Set<number> {
  return new Set(roots.map((r) => r.id))
}
