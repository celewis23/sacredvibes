import type { AuthUser } from '@/types'

export const ADMIN_ROLES = ['Admin', 'Editor', 'Manager'] as const

export function normalizeRole(role?: string | null) {
  return role?.trim().toLowerCase() ?? ''
}

export function isAdminRole(role?: string | null) {
  const normalized = normalizeRole(role)
  return ADMIN_ROLES.some(adminRole => adminRole.toLowerCase() === normalized)
}

export function isMemberRole(role?: string | null) {
  return normalizeRole(role) === 'member'
}

export function getPostLoginPath(user?: Pick<AuthUser, 'role'> | null) {
  return isAdminRole(user?.role) ? '/admin' : '/account'
}
