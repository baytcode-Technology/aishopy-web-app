'use client'

import {
  sendSignInOtp,
  signInWithGoogle as signInWithGoogleApi,
  signInWithGoogleAuthCode as signInWithGoogleAuthCodeApi,
  verifyOtp as verifyOtpApi,
} from '@/core/api/auth'
import { setOnSessionExpired } from '@/core/api/client'
import { emailFromAccessToken } from '@/core/lib/jwt-claims'
import {
  ensureValidSession,
  isAccessTokenExpired,
  isSigningOut,
  SessionExpiredError,
  setSigningOut,
  SigningOutAbortError,
} from '@/core/lib/session-manager'
import type { AuthSession, AuthUser } from '@/core/types/auth'
import {
  clearTokens,
  getAccessToken,
  getAuthUser,
  getRefreshToken,
  saveAuthSession,
} from '@/platform/auth-storage'
import { usePathname, useRouter } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type AuthContextValue = {
  isLoading: boolean
  isAuthenticated: boolean
  user: AuthUser | null
  sendOtp: (email: string) => Promise<void>
  verifyOtp: (email: string, otp: string) => Promise<void>
  signInWithGoogle: (idToken: string) => Promise<void>
  signInWithGoogleAuthCode: (input: {
    code: string
    redirectUri: string
    codeVerifier: string
  }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function restoreUserFromStorage(): Promise<AuthUser | null> {
  const savedUser = await getAuthUser()
  if (savedUser) return savedUser

  const token = await getAccessToken()
  if (!token) return null

  const email = emailFromAccessToken(token)
  if (!email) return null

  return { id: '', email, createdAt: '', isNewUser: false }
}

async function applyAuthSession(
  data: { user: AuthUser; session: AuthSession },
  setUser: (user: AuthUser) => void,
  setIsAuthenticated: (value: boolean) => void,
) {
  setSigningOut(false)
  await saveAuthSession(data.session, data.user)
  setUser(data.user)
  setIsAuthenticated(true)
}

async function tryRestoreAuthenticatedSession(): Promise<boolean> {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) return false

  try {
    await ensureValidSession()
    return true
  } catch (error) {
    if (error instanceof SessionExpiredError || error instanceof SigningOutAbortError) {
      return false
    }
    const accessToken = await getAccessToken()
    if (!accessToken) return false
    const expired = await isAccessTokenExpired(0)
    return !expired
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  const signOut = useCallback(async () => {
    try {
      setSigningOut(true)
      await clearTokens()
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setSigningOut(false)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const ok = await tryRestoreAuthenticatedSession()
        if (!ok) {
          await clearTokens()
          setIsAuthenticated(false)
          return
        }

        const restoredUser = await restoreUserFromStorage()
        if (restoredUser) setUser(restoredUser)
        setIsAuthenticated(true)
      } catch {
        await clearTokens()
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    setOnSessionExpired(() => {
      void (async () => {
        if (isSigningOut()) return
        await signOut()
        if (pathname !== '/login') {
          router.replace('/login')
        }
      })()
    })
    return () => setOnSessionExpired(null)
  }, [pathname, router, signOut])

  const sendOtp = useCallback(async (email: string) => {
    await sendSignInOtp(email)
  }, [])

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    const res = await verifyOtpApi(email, otp)
    await applyAuthSession(res.data, setUser, setIsAuthenticated)
  }, [])

  const signInWithGoogle = useCallback(async (idToken: string) => {
    const res = await signInWithGoogleApi(idToken)
    await applyAuthSession(res.data, setUser, setIsAuthenticated)
  }, [])

  const signInWithGoogleAuthCode = useCallback(
    async (input: { code: string; redirectUri: string; codeVerifier: string }) => {
      const res = await signInWithGoogleAuthCodeApi(input)
      await applyAuthSession(res.data, setUser, setIsAuthenticated)
    },
    [],
  )

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      user,
      sendOtp,
      verifyOtp,
      signInWithGoogle,
      signInWithGoogleAuthCode,
      signOut,
    }),
    [
      isLoading,
      isAuthenticated,
      user,
      sendOtp,
      verifyOtp,
      signInWithGoogle,
      signInWithGoogleAuthCode,
      signOut,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
