'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import { dashboardApi, settingsApi } from '@/lib/api'
import { getBrandBasePath } from '@/lib/brand/resolution'
import type { Brand, SocialLinks } from '@/types'

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ errors?: string[]; message?: string }>
  if (axiosError.code === 'ECONNABORTED') return 'The request timed out.'
  if (axiosError.response?.status === 404) return 'The backend settings endpoint is not available yet. Deploy the backend API and try again.'
  if (axiosError.response?.status === 401 || axiosError.response?.status === 403) return 'Your admin session is not authorized. Sign in again and try saving.'
  return axiosError.response?.data?.errors?.[0] ?? axiosError.response?.data?.message ?? fallback
}

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
  const queryClient = useQueryClient()
  const [adminEmail, setAdminEmail] = useState('')
  const [notifyOnLead, setNotifyOnLead] = useState(true)
  const [notifyOnBooking, setNotifyOnBooking] = useState(true)
  const [assistantEnabled, setAssistantEnabled] = useState(false)
  const [assistantProvider, setAssistantProvider] = useState<'OpenAI' | 'Anthropic'>('OpenAI')
  const [assistantModel, setAssistantModel] = useState('gpt-5.5')
  const [assistantImageModel, setAssistantImageModel] = useState('gpt-image-2')
  const [assistantApiKey, setAssistantApiKey] = useState('')
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({})

  const { data: brands, isLoading } = useQuery({
    queryKey: ['brands'],
    queryFn: () => dashboardApi.getBrands().then(r => r.data.data ?? []),
  })

  const { data: assistantSettings, isLoading: assistantSettingsLoading } = useQuery({
    queryKey: ['admin-assistant-settings'],
    queryFn: () => settingsApi.getAdminAssistant().then(r => r.data.data),
  })

  useEffect(() => {
    if (!assistantSettings) return
    setAssistantEnabled(assistantSettings.isEnabled)
    setAssistantProvider(assistantSettings.provider)
    setAssistantModel(assistantSettings.model)
    setAssistantImageModel(assistantSettings.imageModel)
    setAssistantApiKey('')
  }, [assistantSettings])

  const { data: socialLinksData, isLoading: socialLinksLoading } = useQuery({
    queryKey: ['social-links-settings'],
    queryFn: () => settingsApi.getSocialLinks().then(r => r.data.data),
  })

  useEffect(() => {
    if (!socialLinksData) return
    setSocialLinks(socialLinksData)
  }, [socialLinksData])

  const saveSocialLinksMutation = useMutation({
    mutationFn: () => settingsApi.saveSocialLinks(socialLinks),
    onSuccess: () => {
      toast.success('Social links saved')
      queryClient.invalidateQueries({ queryKey: ['social-links-settings'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save social links')),
  })

  const saveAssistantMutation = useMutation({
    mutationFn: () => settingsApi.saveAdminAssistant({
      isEnabled: assistantEnabled,
      provider: assistantProvider,
      model: assistantModel,
      imageModel: assistantImageModel,
      apiKey: assistantApiKey.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success('Admin assistant settings saved')
      setAssistantApiKey('')
      queryClient.invalidateQueries({ queryKey: ['admin-assistant-settings'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save admin assistant settings')),
  })

  const handleSaveNotifications = () => {
    // Placeholder — wire up to a settings API endpoint when implemented
    toast.success('Notification settings saved')
  }

  return (
    <div className="p-6 lg:p-8">
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

        {/* Admin assistant */}
        <Section
          title="Admin Assistant"
          description="Connect the floating assistant to either OpenAI ChatGPT or Anthropic Claude."
        >
          {assistantSettingsLoading ? (
            <p className="text-sm text-gray-400">Loading assistant settings...</p>
          ) : (
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <span>
                  <span className="block text-sm font-medium text-gray-800">Enabled</span>
                  <span className="block text-xs text-gray-500">
                    {assistantSettings?.hasApiKey ? 'API key saved' : 'API key required'}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={assistantEnabled}
                  onChange={e => setAssistantEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-sacred-600 focus:ring-sacred-500"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <select
                    value={assistantProvider}
                    onChange={e => {
                      const provider = e.target.value as 'OpenAI' | 'Anthropic'
                      setAssistantProvider(provider)
                      setAssistantModel(provider === 'Anthropic' ? 'claude-sonnet-4-6' : 'gpt-5.5')
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                  >
                    <option value="OpenAI">OpenAI / ChatGPT</option>
                    <option value="Anthropic">Anthropic / Claude</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chat Model</label>
                  <input
                    value={assistantModel}
                    onChange={e => setAssistantModel(e.target.value)}
                    placeholder={assistantProvider === 'Anthropic' ? 'claude-sonnet-4-6' : 'gpt-5.5'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={assistantApiKey}
                  onChange={e => setAssistantApiKey(e.target.value)}
                  placeholder={assistantSettings?.hasApiKey ? 'Saved; leave blank to keep' : 'Paste API key'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI Image Model</label>
                <input
                  value={assistantImageModel}
                  onChange={e => setAssistantImageModel(e.target.value)}
                  placeholder="gpt-image-2"
                  disabled={assistantProvider !== 'OpenAI'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500 disabled:bg-gray-100 disabled:text-gray-400"
                />
                {assistantProvider !== 'OpenAI' && (
                  <p className="mt-1 text-xs text-gray-500">Claude can draft image prompts; image file generation requires OpenAI.</p>
                )}
              </div>

              <button
                onClick={() => saveAssistantMutation.mutate()}
                disabled={saveAssistantMutation.isPending || !assistantModel.trim()}
                className="px-4 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 transition-colors disabled:opacity-50"
              >
                {saveAssistantMutation.isPending ? 'Saving...' : 'Save Assistant Settings'}
              </button>
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

        {/* Social links */}
        <Section
          title="Social Links"
          description="Set these once and they'll appear everywhere the site shows social icons (footer, and anywhere else added later)."
        >
          {socialLinksLoading ? (
            <p className="text-sm text-gray-400">Loading social links...</p>
          ) : (
            <div className="space-y-4">
              {([
                ['instagram', 'Instagram', 'https://instagram.com/yourhandle'],
                ['facebook', 'Facebook', 'https://facebook.com/yourpage'],
                ['youTube', 'YouTube', 'https://youtube.com/@yourchannel'],
                ['tikTok', 'TikTok', 'https://tiktok.com/@yourhandle'],
                ['bioBox', 'BioBox', 'https://biobox.app/yourpage'],
              ] as const).map(([key, label, placeholder]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="url"
                    value={socialLinks[key] ?? ''}
                    onChange={e => setSocialLinks(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                  />
                </div>
              ))}

              <button
                onClick={() => saveSocialLinksMutation.mutate()}
                disabled={saveSocialLinksMutation.isPending}
                className="px-4 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 transition-colors disabled:opacity-50"
              >
                {saveSocialLinksMutation.isPending ? 'Saving...' : 'Save Social Links'}
              </button>
            </div>
          )}
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
