export async function shareLink(input: { title: string; url: string }): Promise<'shared' | 'copied' | 'dismissed'> {
  const payload = { title: input.title, url: input.url, text: input.title }
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share(payload)
      return 'shared'
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'dismissed'
  }
  try {
    await navigator.clipboard.writeText(input.url)
    return 'copied'
  } catch {
    return 'dismissed'
  }
}
