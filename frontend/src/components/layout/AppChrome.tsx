'use client'

import { usePathname } from 'next/navigation'
import type { BrandContext } from '@/lib/brand/resolution'
import MemberBottomNav from '@/components/layout/MemberBottomNav'
import SiteFooter from '@/components/layout/SiteFooter'
import SiteHeader from '@/components/layout/SiteHeader'

export default function AppChrome({
  brand,
  children,
}: {
  brand: BrandContext
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? ''
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')

  return (
    <>
      {!isAdminRoute && <SiteHeader brand={brand} />}
      <div className={!isAdminRoute ? 'pb-16 lg:pb-0' : ''}>
        {children}
      </div>
      {!isAdminRoute && <SiteFooter brand={brand} />}
      {!isAdminRoute && <MemberBottomNav />}
    </>
  )
}
