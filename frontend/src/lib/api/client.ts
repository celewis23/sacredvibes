import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// Attach access token
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('access_token') ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = Cookies.get('refresh_token')

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken })
          const newToken = data?.data?.accessToken
          if (newToken) {
            Cookies.set('access_token', newToken, { secure: true, sameSite: 'strict' })
            if (typeof window !== 'undefined') localStorage.setItem('access_token', newToken)
            apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`
            if (original.headers) original.headers.Authorization = `Bearer ${newToken}`
            return apiClient(original)
          }
        } catch {
          Cookies.remove('access_token')
          Cookies.remove('refresh_token')
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token')
            window.location.href = '/admin/login'
          }
        }
      }
    }

    return Promise.reject(error)
  }
)

export function setAuthTokens(accessToken: string, refreshToken: string) {
  Cookies.set('access_token', accessToken, { secure: true, sameSite: 'strict', expires: 1 })
  Cookies.set('refresh_token', refreshToken, { secure: true, sameSite: 'strict', expires: 30 })
  if (typeof window !== 'undefined') localStorage.setItem('access_token', accessToken)
}

export function clearAuthTokens() {
  Cookies.remove('access_token')
  Cookies.remove('refresh_token')
  if (typeof window !== 'undefined') localStorage.removeItem('access_token')
}
