'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, X, Globe, Palette } from 'lucide-react'
import { brandsApi } from '@/lib/api'
import type { Brand } from '@/types'

type ThemeFields = {
  primaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  fontHeading: string
  fontBody: string
}

type FormState = {
  name: string
  description: string
  tagline: string
  theme: ThemeFields
  seoSettingsJson: string
  isActive: boolean
  sortOrder: string
}

const DEFAULT_THEME: ThemeFields = {
  primaryColor: '#7B6E5D',
  accentColor: '#C4A882',
  backgroundColor: '#FAF7F4',
  textColor: '#3D3530',
  fontHeading: 'Cormorant Garamond',
  fontBody: 'Lato',
}

function parseTheme(json: string): ThemeFields {
  try {
    const parsed = JSON.parse(json) as Partial<ThemeFields>
    return { ...DEFAULT_THEME, ...parsed }
  } catch {
    return { ...DEFAULT_THEME }
  }
}

function serializeTheme(theme: ThemeFields): string {
  return JSON.stringify(theme, null, 2)
}

export default function AdminBrandsPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Brand | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'seo'>('general')
  const [themeError, setThemeError] = useState('')
  const [seoError, setSeoError] = useState('')

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => brandsApi.getBrands().then(r => r.data.data ?? []),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => brandsApi.updateBrand(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-brands'] })
      toast.success('Brand updated')
      setEditing(null)
      setForm(null)
    },
    onError: () => toast.error('Failed to update brand'),
  })

  function openEdit(b: Brand) {
    setEditing(b)
    setForm({
      name: b.name,
      description: b.description ?? '',
      tagline: b.tagline ?? '',
      theme: parseTheme(b.themeSettingsJson),
      seoSettingsJson: b.seoSettingsJson,
      isActive: b.isActive,
      sortOrder: b.sortOrder.toString(),
    })
    setActiveTab('general')
    setThemeError('')
    setSeoError('')
  }

  function closePanel() {
    setEditing(null)
    setForm(null)
  }

  function validateJson(val: string): boolean {
    try { JSON.parse(val); return true } catch { return false }
  }

  function handleSave() {
    if (!form || !editing) return

    if (!validateJson(form.seoSettingsJson)) {
      setSeoError('Invalid JSON')
      setActiveTab('seo')
      return
    }

    updateMutation.mutate({
      id: editing.id,
      data: {
        name: form.name,
        description: form.description || undefined,
        tagline: form.tagline || undefined,
        themeSettingsJson: serializeTheme(form.theme),
        seoSettingsJson: form.seoSettingsJson,
        isActive: form.isActive,
        sortOrder: parseInt(form.sortOrder) || 0,
      }
    })
  }

  function set(key: keyof FormState, value: unknown) {
    setForm(f => f ? { ...f, [key]: value } : f)
  }

  const typeColors: Record<string, string> = {
    Parent: 'bg-yoga-100 text-yoga-800',
    SubBrand: 'bg-sound-100 text-sound-800',
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Brands</h1>
        <p className="text-sm text-gray-500 mt-1">Manage brand identity, themes, and SEO settings</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="space-y-4">
          {brands.map((b: Brand) => (
            <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-5">
              {/* Color swatch from theme */}
              <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-white font-heading font-bold text-lg shadow-sm"
                style={{ backgroundColor: (() => { try { return JSON.parse(b.themeSettingsJson)?.primaryColor ?? '#7B6E5D' } catch { return '#7B6E5D' } })() }}>
                {b.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-gray-900">{b.name}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[b.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {b.type}
                  </span>
                  {!b.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>
                  )}
                </div>
                {b.tagline && <p className="text-sm text-gray-500 italic mb-1">&ldquo;{b.tagline}&rdquo;</p>}
                {b.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{b.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Globe size={11} /> {b.slug}</span>
                  <span className="flex items-center gap-1"><Palette size={11} /> Theme configured</span>
                </div>
              </div>

              <button
                onClick={() => openEdit(b)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Pencil size={13} /> Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit panel */}
      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={closePanel} />
          <div className="relative bg-white h-full w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
              <h2 className="font-semibold text-gray-900">Edit: {editing.name}</h2>
              <button onClick={closePanel} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 shrink-0">
              {([['general', 'General'], ['theme', 'Theme'], ['seo', 'SEO']] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-yoga-700 text-yoga-800'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Brand Name *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tagline</label>
                    <input value={form.tagline} onChange={e => set('tagline', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                      placeholder="Move. Breathe. Heal. Thrive." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500 resize-none" />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
                        className="rounded border-gray-300 text-yoga-600 focus:ring-yoga-500" />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                      <input type="number" value={form.sortOrder} onChange={e => set('sortOrder', e.target.value)}
                        className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-1">
                    <p><span className="font-medium text-gray-500">Slug:</span> {editing.slug}</p>
                    <p><span className="font-medium text-gray-500">Type:</span> {editing.type}</p>
                    <p><span className="font-medium text-gray-500">Subdomain:</span> {editing.slug}</p>
                  </div>
                </div>
              )}

              {activeTab === 'theme' && (
                <div className="space-y-5">
                  {/* Live preview swatch */}
                  <div className="rounded-xl p-4 flex items-center gap-4 border border-gray-100"
                    style={{ backgroundColor: form.theme.backgroundColor }}>
                    <div className="w-10 h-10 rounded-full shadow-sm flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${form.theme.primaryColor}, ${form.theme.accentColor})` }} />
                    <div>
                      <p className="font-semibold text-sm" style={{ color: form.theme.textColor }}>
                        {form.name}
                      </p>
                      <p className="text-xs" style={{ color: form.theme.primaryColor }}>
                        Preview — colors update as you edit
                      </p>
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: 'primaryColor',   label: 'Primary Color' },
                      { key: 'accentColor',    label: 'Accent Color' },
                      { key: 'backgroundColor', label: 'Background' },
                      { key: 'textColor',      label: 'Text Color' },
                    ] as { key: keyof ThemeFields; label: string }[]).map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1.5">
                          <input
                            type="color"
                            value={form.theme[key]}
                            onChange={e => set('theme', { ...form.theme, [key]: e.target.value })}
                            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={form.theme[key]}
                            onChange={e => set('theme', { ...form.theme, [key]: e.target.value })}
                            className="flex-1 text-xs font-mono focus:outline-none text-gray-700 min-w-0"
                            maxLength={7}
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Fonts */}
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500">Typography</p>
                    {([
                      { key: 'fontHeading', label: 'Heading Font' },
                      { key: 'fontBody',    label: 'Body Font' },
                    ] as { key: keyof ThemeFields; label: string }[]).map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                        <input
                          type="text"
                          value={form.theme[key]}
                          onChange={e => set('theme', { ...form.theme, [key]: e.target.value })}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                          placeholder="e.g. Cormorant Garamond"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">SEO Settings (JSON)</label>
                    <textarea
                      value={form.seoSettingsJson}
                      onChange={e => { set('seoSettingsJson', e.target.value); setSeoError('') }}
                      rows={10}
                      spellCheck={false}
                      className={`w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-yoga-500 resize-none ${seoError ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    {seoError && <p className="text-xs text-red-500 mt-1">{seoError}</p>}
                  </div>
                  <div className="text-xs text-gray-400">
                    <p className="font-medium text-gray-500 mb-1">Expected keys:</p>
                    <p>siteTitle, description, keywords (array)</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button onClick={closePanel}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="px-5 py-2 bg-yoga-700 text-white rounded-xl text-sm font-medium hover:bg-yoga-800 transition-colors disabled:opacity-50">
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
