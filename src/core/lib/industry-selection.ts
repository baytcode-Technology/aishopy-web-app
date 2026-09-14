import type { IndustryGroup } from '@/core/types/industry'

const SEPARATOR = ', '

export function parseIndustryValues(value: string | null | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

export function serializeIndustryValues(values: string[]): string {
  return values.filter(Boolean).join(SEPARATOR)
}

export function isKnownIndustryName(name: string, groups: IndustryGroup[]): boolean {
  return groups.some((group) => group.children.some((child) => child.name === name))
}

/** Split stored value into catalog picks vs custom (non-catalog) entries. */
export function splitIndustryValues(
  value: string | null | undefined,
  groups: IndustryGroup[],
): { selected: string[]; custom: string[] } {
  const parts = parseIndustryValues(value)
  const selected: string[] = []
  const custom: string[] = []

  for (const part of parts) {
    if (isKnownIndustryName(part, groups)) {
      if (!selected.includes(part)) selected.push(part)
    } else {
      custom.push(part)
    }
  }

  return { selected, custom }
}

export function formatIndustryDisplay(
  value: string | null | undefined,
  groups: IndustryGroup[],
): string {
  const parts = parseIndustryValues(value)
  if (parts.length === 0) return ''

  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return `${parts[0]}, ${parts[1]}`
  return `${parts[0]}, ${parts[1]} +${parts.length - 2} more`
}

export function isGroupFullySelected(group: IndustryGroup, selected: Set<string>): boolean {
  if (group.children.length === 0) return false
  return group.children.every((child) => selected.has(child.name))
}

export function isGroupPartiallySelected(group: IndustryGroup, selected: Set<string>): boolean {
  const count = group.children.filter((child) => selected.has(child.name)).length
  return count > 0 && count < group.children.length
}

export function toggleGroupSelection(group: IndustryGroup, selected: Set<string>): Set<string> {
  const next = new Set(selected)
  const allSelected = isGroupFullySelected(group, selected)

  for (const child of group.children) {
    if (allSelected) {
      next.delete(child.name)
    } else {
      next.add(child.name)
    }
  }

  return next
}

export function toggleIndustrySelection(name: string, selected: Set<string>): Set<string> {
  const next = new Set(selected)
  if (next.has(name)) {
    next.delete(name)
  } else {
    next.add(name)
  }
  return next
}

export function buildStoredIndustryValue(input: {
  selected: Set<string>
  customValues: string[]
}): string {
  const merged = [...input.selected, ...input.customValues.map((v) => v.trim()).filter(Boolean)]
  return serializeIndustryValues(merged)
}
