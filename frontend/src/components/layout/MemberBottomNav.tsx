'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { Home, PlayCircle, User, LogIn } from 'lucide-react'
import { clsx } from 'clsx'

export default function MemberBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  // Admin routes have their own bottom nav inside AdminShell
  if (pathname.startsWith('/admin')) return null

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  const tabs = [
    { label: 'Home',   href: '/',                       icon: Home,       exact: true },
    { label: 'Studio', href: '/digital-studio/library', icon: PlayCircle, exact: false },
    {
      label: user ? 'Account' : 'Sign In',
      href:  user ? '/account' : '/login',
      icon:  user ? User : LogIn,
      exact: false,
    },
  ]

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-t border-sacred-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map(tab => {
          const active = isActive(tab.href, tab.exact)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                'flex flex-col items-center gap-1 flex-1 py-2 transition-colors',
                active ? 'text-yoga-700' : 'text-sacred-400 hover:text-sacred-600'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
