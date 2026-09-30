import { disablePlatformAdminBrowserPush } from '@/core/lib/platform-admin-web-push'
import { unregisterStoredWebPushOnSignOut } from '@/core/lib/web-push'

/** Clears store + admin browser push bindings before auth sign-out. */
export async function clearWebPushOnSignOut(storeId: number | null): Promise<void> {
  await unregisterStoredWebPushOnSignOut(storeId)
  try {
    await disablePlatformAdminBrowserPush()
  } catch {
    /* best-effort — still continue sign-out */
  }
}
