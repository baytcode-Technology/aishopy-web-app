import type { Store, UpdateStorePayload } from '@/core/types/store'
import { slugifyFromName } from '@/core/validations/store.validation'

export type StoreEditForm = {
  name: string
  industry: string
  description: string
  whatsapp_number: string
  country: string
  currency: string
  logo_url?: string | null
}

export function buildStoreUpdatePatch(store: Store, form: StoreEditForm): UpdateStorePayload {
  const patch: UpdateStorePayload = {}
  const name = form.name.trim()
  const industry = form.industry.trim() || null
  const description = form.description.trim() || null
  const whatsapp = form.whatsapp_number.trim() || null
  const currentWhatsapp = store.whatsapp_number ?? null

  if (name !== store.name) {
    patch.name = name
    const nextSlug = slugifyFromName(name)
    if (nextSlug && nextSlug !== store.slug) {
      patch.slug = nextSlug
    }
  }
  if (industry !== (store.industry ?? null)) patch.industry = industry
  if (description !== (store.description ?? null)) patch.description = description
  if (whatsapp !== currentWhatsapp) patch.whatsapp_number = whatsapp
  if (form.country.trim() !== store.country) patch.country = form.country.trim()
  if (form.currency.trim().toUpperCase() !== store.currency) {
    patch.currency = form.currency.trim().toUpperCase()
  }

  if (form.logo_url !== undefined && form.logo_url !== store.logo_url) {
    patch.logo_url = form.logo_url
  }

  return patch
}
