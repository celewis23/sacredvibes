'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { AuthUser } from '@/types'
import { authApi } from '@/lib/api'
import { setAuthTokens, clearAuthTokens } from '@/lib/api/client'
import Cookies from 'js-cookie'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = Cookies.get('access_token') ?? localStorage.getItem('access_token')
    if (!token) { setIsLoading(false); return }

    try {
      const { data } = await authApi.me()
      if (data.success && data.data) setUser(data.data as unknown as AuthUser)
    } catch {
      clearAuthTokens()
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password)
    if (!data.success || !data.data) throw new Error(data.errors?.[0] ?? 'Login failed')
    setAuthTokens(data.data.accessToken, data.data.refreshToken)
    setUser(data.data.user)
  }

  const logout = async () => {
    const refreshToken = Cookies.get('refresh_token')
    if (refreshToken) {
      try { await authApi.logout(refreshToken) } catch { /* silent */ }
    }
    clearAuthTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
