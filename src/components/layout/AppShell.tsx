'use client'

import { RequireAuth } from '@/components/auth/RequireAuth'
import { AppLogo } from '@/components/brand/AppLogo'
import {
  ChatsIcon,
  DashboardIcon,
  OrdersIcon,
  ProductsIcon,
} from '@/components/layout/NavIcons'
import { fetchSupportAdminStatus } from '@/core/api/support'
import { getErrorMessage } from '@/core/lib/api-error'
import { UnreadCountBadge } from '@/components/ui/UnreadCountBadge'
import { useAuth } from '@/providers/auth-provider'
import { useChatsUnread } from '@/providers/chats-unread-provider'
import { useOrdersUnread } from '@/providers/orders-unread-provider'
import { useStore } from '@/providers/store-provider'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

const NAV = [
  { href: '/inbox', label: 'Chats', Icon: ChatsIcon },
  { href: '/products', label: 'Products', Icon: ProductsIcon },
  { href: '/orders', label: 'Orders', Icon: OrdersIcon },
  { href: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
] as const

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

const SETTINGS_STACK = [
  '/settings',
  '/storefront',
  '/notifications',
  '/admin-dashboard',
  '/staff-management',
  '/account-coming-soon',
  '/platform-admin',
  '/connect-whatsapp',
  '/instagram-connect',
  '/website-customize',
  '/template-preview',
  '/payment-methods',
]

function isDetailRoute(pathname: string) {
  if (SETTINGS_STACK.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return true
  }
  if (/^\/products\/categories\/[^/]+$/.test(pathname)) return true
  if (/^\/products\/[^/]+$/.test(pathname) && pathname !== '/products/categories') return true
  if (/^\/orders\/[^/]+$/.test(pathname)) return true
  if (/^\/inbox\/[^/]+$/.test(pathname)) return true
  return false
}

function AppGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { store, hydrateActiveStore } = useStore()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    let cancelled = false

    void (async () => {
      try {
        const [hasStore, adminRes] = await Promise.all([
          store ? Promise.resolve(true) : hydrateActiveStore(),
          fetchSupportAdminStatus().catch(() => ({ data: { isAdmin: false } })),
        ])
        if (cancelled) return
        setIsAdmin(adminRes.data.isAdmin)
        if (!hasStore && !store && !adminRes.data.isAdmin) {
          router.replace('/store-check')
          return
        }
        setReady(true)
      } catch (e) {
        if (cancelled) return
        setError(getErrorMessage(e, 'Could not open your store'))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authLoading, hydrateActiveStore, isAuthenticated, router, store])

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 px-6">
        <AppLogo href="" />
        <p className="text-center text-sm text-gray-600">{error}</p>
      </main>
    )
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100">
        <AppLogo href="" />
        <p className="text-sm font-semibold text-gray-500">Preparing your workspace…</p>
      </main>
    )
  }

  if (!store && !isAdmin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100">
        <AppLogo href="" />
        <p className="text-sm font-semibold text-gray-500">Preparing your workspace…</p>
      </main>
    )
  }

  return children
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const { store, sessionStoreName, clearStore } = useStore()
  const { ordersUnreadCount } = useOrdersUnread()
  const { chatsUnreadCount } = useChatsUnread()
  const storeName = store?.name ?? sessionStoreName ?? 'AiShopy'
  const hideTabs = isDetailRoute(pathname)

  const handleSignOut = async () => {
    await clearStore()
    await signOut()
    router.replace('/login')
  }

  return (
    <RequireAuth>
      <AppGate>
        <div className="min-h-screen bg-gray-100 lg:flex">
          <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-surface">
            <div className="px-5 pb-2 pt-6">
              <AppLogo />
              <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
                Store
              </p>
              <p className="mt-1 truncate text-[15px] font-semibold text-ink">{storeName}</p>
            </div>
            <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
              {NAV.map(({ href, label, Icon }) => {
                const active = isActive(pathname, href)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-[14px] font-semibold ${
                      active ? 'bg-gray-100 text-ink' : 'text-gray-500 hover:bg-gray-50 hover:text-ink'
                    }`}
                  >
                    <span className="relative">
                      <Icon className={`h-5 w-5 ${active ? 'text-ink' : 'text-gray-400'}`} />
                      {href === '/orders' ? (
                        <UnreadCountBadge count={ordersUnreadCount} className="absolute -right-2 -top-1" />
                      ) : null}
                      {href === '/inbox' ? (
                        <UnreadCountBadge count={chatsUnreadCount} className="absolute -right-2 -top-1" />
                      ) : null}
                    </span>
                    {label}
                  </Link>
                )
              })}
            </nav>
            <div className="flex flex-col gap-1 border-t border-gray-200 px-3 py-4">
              <Link
                href="/select-store"
                className="rounded-2xl px-3 py-2.5 text-[13px] font-semibold text-ink hover:bg-gray-50"
              >
                Switch store
              </Link>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="rounded-2xl px-3 py-2.5 text-left text-[13px] font-semibold text-gray-500 hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          </aside>

          <div className={`flex min-h-screen flex-1 flex-col ${hideTabs ? '' : 'pb-24 lg:pb-0'}`}>
            <div className="flex-1">{children}</div>
          </div>

          {hideTabs ? null : (
            <nav className="fixed inset-x-0 bottom-0 z-20 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
              <div className="flex items-center justify-between rounded-[26px] border border-gray-200 bg-surface px-2 py-2 shadow-lg">
                {NAV.map(({ href, label, Icon }) => {
                  const active = isActive(pathname, href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex min-w-[56px] flex-1 flex-col items-center rounded-[18px] px-2 py-1.5 ${
                        active ? 'bg-gray-100' : ''
                      }`}
                    >
                      <span className="relative">
                        <Icon className={`h-5 w-5 ${active ? 'text-ink' : 'text-gray-400'}`} />
                        {href === '/orders' ? (
                          <UnreadCountBadge count={ordersUnreadCount} className="absolute -right-2 -top-1" />
                        ) : null}
                        {href === '/inbox' ? (
                          <UnreadCountBadge count={chatsUnreadCount} className="absolute -right-2 -top-1" />
                        ) : null}
                      </span>
                      <span
                        className={`mt-1 text-[10px] font-bold tracking-wide ${
                          active ? 'text-ink' : 'text-gray-400'
                        }`}
                      >
                        {label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </nav>
          )}
        </div>
      </AppGate>
    </RequireAuth>
  )
}
