'use client'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { Modal } from '@/components/ui/Modal'
import { fetchIndustries } from '@/core/api/industries'
import {
  buildStoredIndustryValue,
  formatIndustryDisplay,
  isGroupFullySelected,
  isGroupPartiallySelected,
  splitIndustryValues,
  toggleGroupSelection,
  toggleIndustrySelection,
} from '@/core/lib/industry-selection'
import type { IndustryGroup } from '@/core/types/industry'
import { useEffect, useMemo, useState } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  error?: string
  label?: string
}

function SelectionCheckbox({
  checked,
  partial,
  onPress,
}: {
  checked: boolean
  partial?: boolean
  onPress: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`flex h-[22px] w-[22px] items-center justify-center rounded-md border ${
        checked || partial ? 'border-ink bg-brand-primary' : 'border-gray-300 bg-surface'
      }`}
    >
      {checked ? (
        <MenuIcon name="check" className="h-3 w-3 text-brand-on-primary" />
      ) : partial ? (
        <span className="h-0.5 w-2.5 rounded-full bg-brand-on-primary" />
      ) : null}
    </button>
  )
}

export function IndustryPicker({
  value,
  onChange,
  error,
  label = 'Industries',
}: Props) {
  const [open, setOpen] = useState(false)
  const [groups, setGroups] = useState<IndustryGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draftSelected, setDraftSelected] = useState<Set<string>>(new Set())
  const [draftOtherEnabled, setDraftOtherEnabled] = useState(false)
  const [draftCustom, setDraftCustom] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const res = await fetchIndustries()
        if (!cancelled) setGroups(res.data.industries)
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Failed to load industries')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const displayLabel = useMemo(() => formatIndustryDisplay(value, groups), [value, groups])
  const { selected: savedSelected, custom: savedCustom } = useMemo(
    () => splitIndustryValues(value, groups),
    [value, groups],
  )

  const openModal = () => {
    setDraftSelected(new Set(savedSelected))
    setDraftOtherEnabled(savedCustom.length > 0)
    setDraftCustom(savedCustom.join(', '))
    setOpen(true)
  }

  const applySelection = () => {
    const customValues = draftOtherEnabled && draftCustom.trim() ? [draftCustom.trim()] : []
    onChange(
      buildStoredIndustryValue({
        selected: draftSelected,
        customValues,
      }),
    )
    setOpen(false)
  }

  const showOtherFieldOutside = savedCustom.length > 0

  return (
    <div>
      <p className="mb-2 text-[13px] font-bold text-gray-600">{label}</p>
      <button
        type="button"
        onClick={openModal}
        className={`flex w-full items-center justify-between rounded-xl border bg-surface px-4 py-3.5 ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
      >
        <span
          className={`flex-1 text-left text-[15px] ${
            displayLabel ? 'font-medium text-ink' : 'text-gray-400'
          }`}
        >
          {loading ? 'Loading industries…' : displayLabel || 'Select industries'}
        </span>
        <MenuIcon name="chevron-down" className="h-3 w-3 text-gray-400" />
      </button>
      {error ? <p className="mt-1.5 pl-1 text-xs text-red-500">{error}</p> : null}
      {loadError ? <p className="mt-1.5 pl-1 text-xs text-amber-600">{loadError}</p> : null}

      {showOtherFieldOutside ? (
        <div className="mt-3">
          <Input
            label="Custom industry"
            value={savedCustom.join(', ')}
            onChange={(event) => {
              onChange(
                buildStoredIndustryValue({
                  selected: new Set(savedSelected),
                  customValues: event.target.value.trim() ? [event.target.value.trim()] : [],
                }),
              )
            }}
            placeholder="Enter your industry"
          />
        </div>
      ) : null}

      <Modal
        open={open}
        title="Select industries"
        subtitle="Pick one or more — or select all under a category"
        onClose={() => setOpen(false)}
        zClass="z-50"
        footer={
          <Button
            label={`Done${draftSelected.size > 0 ? ` (${draftSelected.size})` : ''}`}
            onClick={applySelection}
          />
        }
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-primary" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-2">
            {groups.map((group) => {
              const allSelected = isGroupFullySelected(group, draftSelected)
              const partial = isGroupPartiallySelected(group, draftSelected)

              return (
                <div key={group.id}>
                  <div className="mb-2 flex items-center justify-between gap-3 px-1">
                    <p className="flex-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {group.name}
                    </p>
                    <SelectionCheckbox
                      checked={allSelected}
                      partial={partial}
                      onPress={() => setDraftSelected(toggleGroupSelection(group, draftSelected))}
                    />
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-surface">
                    {group.children.map((child, index) => {
                      const selected = draftSelected.has(child.name)
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() =>
                            setDraftSelected(toggleIndustrySelection(child.name, draftSelected))
                          }
                          className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${
                            index < group.children.length - 1 ? 'border-b border-gray-100' : ''
                          } ${selected ? 'bg-gray-50' : ''}`}
                        >
                          <SelectionCheckbox
                            checked={selected}
                            onPress={() =>
                              setDraftSelected(toggleIndustrySelection(child.name, draftSelected))
                            }
                          />
                          <span className="flex-1 text-[15px] font-medium text-ink">{child.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <div>
              <div className="mb-2 flex items-center justify-between gap-3 px-1">
                <p className="flex-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Other
                </p>
                <SelectionCheckbox
                  checked={draftOtherEnabled}
                  onPress={() => setDraftOtherEnabled((v) => !v)}
                />
              </div>
              <div
                className={`rounded-2xl border px-4 py-3.5 ${
                  draftOtherEnabled ? 'border-ink bg-gray-50' : 'border-gray-200 bg-surface'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setDraftOtherEnabled((v) => !v)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <SelectionCheckbox
                    checked={draftOtherEnabled}
                    onPress={() => setDraftOtherEnabled((v) => !v)}
                  />
                  <span className="flex-1 text-[15px] font-medium text-ink">
                    Other (custom industry)
                  </span>
                </button>
                {draftOtherEnabled ? (
                  <div className="mt-3">
                    <Input
                      label="Custom industry"
                      value={draftCustom}
                      onChange={(event) => setDraftCustom(event.target.value)}
                      placeholder="Enter your industry"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
