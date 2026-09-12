export type AuthUser = {
  id: string
  email?: string
  createdAt: string
  isNewUser: boolean
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  expiresAt: number
  tokenType: string
}

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

export type VerifyOtpData = {
  user: AuthUser
  session: AuthSession
}
