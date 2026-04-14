'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { dashboardApi } from '@/lib/api'
import { getBrandBasePath } from '@/lib/brand/resolution'
import type { Brand } from '@/types'

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="mb-5">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function BrandCard({ brand }: { brand: Brand }) {
  let theme: Record<string, string> = {}
  let seo: Record<string, string> = {}
  const routePrefix = getBrandBasePath(brand.slug) || '/'
  try { theme = JSON.parse(brand.themeSettingsJson) } catch { /* ignore */ }
  try { seo = JSON.parse(brand.seoSettingsJson) } catch { /* ignore */ }

  return (
    <div className="border border-gray-200 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full shrink-0"
          style={{ backgroundColor: theme.primaryColor ?? '#6b7280' }}
        />
        <div>
          <h4 className="font-medium text-gray-900">{brand.name}</h4>
          <p className="text-xs text-gray-500">Route: {routePrefix}</p>
        </div>
        <div className="ml-auto">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${brand.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {brand.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      {brand.tagline && <p className="text-sm text-gray-600 italic">{brand.tagline}</p>}
      {seo.defaultTitle && (
        <div className="text-xs text-gray-500">
          <span className="text-gray-400">SEO Title: </span>{seo.defaultTitle}
        </div>
      )}
      {theme.primaryColor && (
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>
            <span className="text-gray-400">Primary: </span>
            <span className="font-mono">{theme.primaryColor}</span>
          </span>
          {theme.accentColor && (
            <span>
              <span className="text-gray-400">Accent: </span>
              <span className="font-mono">{theme.accentColor}</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminSettingsPage() {
  const [adminEmail, setAdminEmail] = useState('')
  const [notifyOnLead, setNotifyOnLead] = useState(true)
  const [notifyOnBooking, setNotifyOnBooking] = useState(true)

  const { data: brands, isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: () => dashboardApi.getBrands().then(r => r.data.data ?? []),
  })

  const handleSaveNotifications = () => {
    // Placeholder — wire up to a settings API endpoint when implemented
    toast.success('Notification settings saved')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Platform configuration and brand management</p>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Brand overview */}
        <Section
          title="Brands"
          description="Active brands on the platform. Configure appearance and SEO in environment variables or the brand seed data."
        >
          {isLoading ? (
            <p className="text-sm text-gray-400">Loading brands...</p>
          ) : (
            <div className="space-y-3">
              {(brands ?? []).map(brand => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>
          )}
        </Section>

        {/* Notifications */}
        <Section
          title="Admin Notifications"
          description="Email address to notify when new leads or bookings come in."
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="info@sacredvibesyoga.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnLead}
                  onChange={e => setNotifyOnLead(e.target.checked)}
                  className="rounded border-gray-300 text-sacred-600 focus:ring-sacred-500"
                />
                <span className="text-sm text-gray-700">Email on new contact/lead form submission</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOnBooking}
                  onChange={e => setNotifyOnBooking(e.target.checked)}
                  className="rounded border-gray-300 text-sacred-600 focus:ring-sacred-500"
                />
                <span className="text-sm text-gray-700">Email on new booking</span>
              </label>
            </div>
            <button
              onClick={handleSaveNotifications}
              className="px-4 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 transition-colors"
            >
              Save Notification Settings
            </button>
          </div>
        </Section>

        {/* Environment info */}
        <Section
          title="Environment"
          description="Read-only configuration overview. Change values in your .env file or environment variables."
        >
          <div className="space-y-2 text-sm font-mono">
            {[
              ['API URL', process.env.NEXT_PUBLIC_API_URL ?? '(not set)'],
              ['Node Environment', process.env.NODE_ENV ?? 'development'],
            ].map(([key, value]) => (
              <div key={key} className="flex items-center gap-4 bg-gray-50 rounded px-3 py-2">
                <span className="text-gray-500 w-36 shrink-0">{key}</span>
                <span className="text-gray-700">{value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
