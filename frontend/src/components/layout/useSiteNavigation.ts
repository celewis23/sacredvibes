'use client'

import type { MouseEvent } from 'react'
import { useCallback } from 'react'
import { usePathname } from 'next/navigation'

function normalizePath(value: string) {
  if (!value) return '/'
  if (value.length > 1 && value.endsWith('/')) return value.slice(0, -1)
  return value
}

function isBypassHref(href: string) {
  return (
    !href ||
    href.startsWith('#') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    /^(https?:)?\/\//.test(href)
  )
}

function getComparablePath(href: string) {
  const [withoutHash] = href.split('#')
  const [path] = withoutHash.split('?')
  return normalizePath(path)
}

export function useSiteNavigation() {
  const pathname = usePathname()
  const currentPath = normalizePath(pathname)

  const navigate = useCallback((href: string, onBeforeNavigate?: () => void) => {
    onBeforeNavigate?.()

    if (typeof window === 'undefined' || isBypassHref(href)) {
      return
    }

    const targetPath = getComparablePath(href)
    if (targetPath === currentPath) {
      return
    }

    window.location.assign(href)
  }, [currentPath])

  const handleNavigationClick = useCallback((
    event: MouseEvent<HTMLElement>,
    href: string,
    onBeforeNavigate?: () => void,
  ) => {
    if (isBypassHref(href)) {
      return
    }

    const targetPath = getComparablePath(href)
    if (targetPath === currentPath) {
      event.preventDefault()
      onBeforeNavigate?.()
      return
    }

    event.preventDefault()
    navigate(href, onBeforeNavigate)
  }, [currentPath, navigate])

  return {
    currentPath,
    navigate,
    handleNavigationClick,
    normalizePath,
  }
}
