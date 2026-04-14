'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import {
  LayoutDashboard, BookOpen, Image, Grid2x2, Calendar, ShoppingBag,
  Users, Upload, MessageSquare, Settings, LogOut, Globe, Megaphone,
  BarChart2, ChevronRight, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import { toast } from 'sonner'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  exact?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    ]
  },
  {
    label: 'Content',
    items: [
      { label: 'Blog', href: '/admin/blog', icon: BookOpen },
      { label: 'Pages', href: '/admin/pages', icon: Globe },
      { label: 'Media Library', href: '/admin/media', icon: Image },
      { label: 'Galleries', href: '/admin/galleries', icon: Grid2x2 },
    ]
  },
  {
    label: 'Offerings',
    items: [
      { label: 'Services', href: '/admin/services', icon: ShoppingBag },
      { label: 'Events', href: '/admin/events', icon: Calendar },
      { label: 'Bookings', href: '/admin/bookings', icon: BarChart2 },
    ]
  },
  {
    label: 'Audience',
    items: [
      { label: 'Subscribers', href: '/admin/subscribers', icon: Users },
      { label: 'Imports', href: '/admin/imports', icon: Upload },
      { label: 'Leads', href: '/admin/leads', icon: MessageSquare },
    ]
  },
  {
    label: 'System',
    items: [
      { label: 'Brands', href: '/admin/brands', icon: Megaphone },
      { label: 'Integrations', href: '/admin/integrations', icon: Settings },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ]
  }
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Redirect to login if not authenticated
  if (!isLoading && !user && pathname !== '/admin/login') {
    router.push('/admin/login')
    return null
  }

  if (pathname === '/admin/login') return <>{children}</>

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    router.push('/admin/login')
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-sacred-900 text-sacred-100 w-64 shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-sacred-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yoga-700 flex items-center justify-center text-white font-heading font-bold text-sm">
            SV
          </div>
          <div>
            <p className="font-medium text-white text-sm">Sacred Vibes</p>
            <p className="text-xs text-sacred-400">Admin Console</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sacred-500 px-3 mb-2">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href, item.exact)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors mb-0.5',
                    active
                      ? 'bg-yoga-700 text-white font-medium'
                      : 'text-sacred-300 hover:text-white hover:bg-sacred-800'
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{item.label}</span>
                  {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-sacred-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-yoga-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
            <p className="text-xs text-sacred-400 truncate">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sacred-400 hover:text-white transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-sacred-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col">
            <Sidebar />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 text-white z-10"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-sacred-100 h-14 flex items-center px-4 lg:px-6 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-sacred-600 hover:text-sacred-900"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <Link
            href="/"
            target="_blank"
            className="text-xs text-sacred-500 hover:text-sacred-800 transition-colors flex items-center gap-1"
          >
            View Site
            <ChevronRight size={12} />
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
