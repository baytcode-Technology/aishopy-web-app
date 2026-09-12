import { ApiHttpError, getValidAccessToken } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'
import { env } from '@/core/config/env'
import { refreshSession } from '@/core/lib/session-manager'

export type UploadImagesResponse = {
  success: boolean
  message: string
  data: { urls: string[] }
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024

async function uploadWithToken(storeId: number, files: File[], token: string): Promise<string[]> {
  const formData = new FormData()
  formData.append('store_id', String(storeId))
  for (const file of files) {
    formData.append('images', file, file.name)
  }

  const base = env.apiBaseUrl.replace(/\/$/, '')
  const url = `${base}${endpoints.uploadProductImages}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        'Image upload API is not available on the server. Redeploy the latest backend (POST /api/uploads/product-images).',
      )
    }
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error?: { message?: string } }).error?.message ?? res.statusText)
        : res.statusText
    throw new ApiHttpError(message || `HTTP ${res.status}`, res.status, body)
  }

  const parsed = body as UploadImagesResponse
  return parsed.data.urls
}

export function assertImageSize(file: File): void {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`${file.name} is larger than 8 MB`)
  }
}

export async function uploadProductImages(storeId: number, files: File[]): Promise<string[]> {
  files.forEach(assertImageSize)

  const run = async (isRetry: boolean): Promise<string[]> => {
    const token = await getValidAccessToken()
    try {
      return await uploadWithToken(storeId, files, token)
    } catch (err) {
      if (err instanceof ApiHttpError && err.status === 401 && !isRetry) {
        const newToken = await refreshSession()
        return uploadWithToken(storeId, files, newToken)
      }
      throw err
    }
  }

  return run(false)
}
