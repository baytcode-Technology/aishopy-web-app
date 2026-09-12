import { ApiHttpError } from '@/core/api/client'

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error instanceof ApiHttpError) {
    const message = parseApiErrorMessage(error.body)
    if (message) return message
    if (error.message) return error.message
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return fallback
}

function parseApiErrorMessage(body: unknown): string | undefined {
  if (typeof body === 'object' && body !== null) {
    if ('error' in body) {
      const err = (body as { error?: { message?: string } }).error
      if (err?.message) return err.message
    }
    if ('message' in body && typeof (body as { message?: string }).message === 'string') {
      return (body as { message: string }).message
    }
  }
  return undefined
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (error instanceof ApiHttpError && typeof error.body === 'object' && error.body !== null) {
    const err = error.body as { error?: { code?: string } }
    return err.error?.code
  }
  return undefined
}
