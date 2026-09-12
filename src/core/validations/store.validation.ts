import type { CreateStorePayload } from '@/core/types/store'
import { z } from 'zod'

const slugRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
const reserved = new Set(['api', 'app', 'www', 'admin', 'mail', 'support'])

export const createStoreFormSchema = z.object({
  name: z.string().trim().min(1, 'Store name is required').max(200),
  slug: z
    .string()
    .trim()
    .min(3, 'Store name must produce a URL of at least 3 characters')
    .max(63, 'Store name is too long')
    .transform((s) => s.toLowerCase())
    .refine((s) => slugRegex.test(s), {
      message: 'Use a store name with letters or numbers',
    })
    .refine((s) => !reserved.has(s), {
      message: 'This name is reserved. Choose another store name.',
    }),
  whatsapp_number: z
    .string()
    .trim()
    .transform((s) => (s === '' ? null : s))
    .pipe(
      z.union([
        z.null(),
        z
          .string()
          .min(8, 'Contact number must be at least 8 characters')
          .max(20, 'Contact number is too long'),
      ]),
    ),
  currency: z
    .string()
    .trim()
    .length(3, 'Currency must be exactly 3 letters (e.g. INR)')
    .transform((s) => s.toUpperCase())
    .refine((s) => /^[A-Z]{3}$/.test(s), {
      message: 'Use a 3-letter currency code (e.g. INR)',
    }),
  description: z.string().trim().max(2000).optional().nullable(),
  industry: z.string().trim().max(1000).optional().nullable(),
  country: z.string().trim().min(1, 'Country is required').max(100),
})

export type CreateStoreFormValues = z.infer<typeof createStoreFormSchema>

export function slugifyFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
}

export function toCreateStorePayload(values: CreateStoreFormValues): CreateStorePayload {
  return {
    name: values.name,
    slug: values.slug,
    whatsapp_number: values.whatsapp_number,
    currency: values.currency,
    description: values.description?.trim() || null,
    industry: values.industry?.trim() || null,
    country: values.country.trim(),
  }
}
