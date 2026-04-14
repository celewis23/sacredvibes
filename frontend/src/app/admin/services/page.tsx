'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { offeringsApi, brandsApi } from '@/lib/api'
import type { ServiceOffering, Brand } from '@/types'

type PriceType = 'Fixed' | 'Variable' | 'Free' | 'Donation' | 'SlidingScale'

const PRICE_TYPES: PriceType[] = ['Fixed', 'Variable', 'Free', 'Donation', 'SlidingScale']

function formatPrice(s: ServiceOffering): string {
  if (s.priceType === 'Free') return 'Free'
  if (s.priceType === 'Donation') return 'Donation'
  if (s.priceType === 'SlidingScale' && s.priceMin != null && s.priceMax != null) {
    const fmt = (n: number) => `$${n}`
    return `${fmt(s.priceMin)} – ${fmt(s.priceMax)}`
  }
  if (s.price != null) return `$${s.price}`
  return s.priceType
}

const emptyForm = {
  brandId: '',
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  category: '',
  priceType: 'Fixed' as PriceType,
  price: '',
  priceMin: '',
  priceMax: '',
  currency: 'USD',
  durationMinutes: '',
  location: '',
  isVirtual: false,
  isBookable: true,
  isActive: true,
  sortOrder: '0',
  seoTitle: '',
  seoDescription: '',
}

type FormState = typeof emptyForm

export default function AdminServicesPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ServiceOffering | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [brandFilter, setBrandFilter] = useState('')

  const { data: brands = [] } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => brandsApi.getBrands().then(r => r.data.data ?? []),
  })

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-offerings-services', brandFilter],
    queryFn: () => offeringsApi.getServices({
      brandId: brandFilter || undefined,
      includeInactive: true,
    }).then(r => r.data.data ?? []),
  })

  const brandName = (id: string) => brands.find((b: Brand) => b.id === id)?.name ?? ''

  const saveMutation = useMutation({
    mutationFn: (data: unknown) => editing
      ? offeringsApi.updateService(editing.id, data)
      : offeringsApi.createService(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-offerings-services'] })
      toast.success(editing ? 'Service updated' : 'Service created')
      closeModal()
    },
    onError: () => toast.error('Failed to save service'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => offeringsApi.deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-offerings-services'] })
      toast.success('Service deleted')
      setDeleteConfirm(null)
    },
    onError: () => toast.error('Failed to delete service'),
  })

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyForm, brandId: brands[0]?.id ?? '' })
    setShowModal(true)
  }

  function openEdit(s: ServiceOffering) {
    setEditing(s)
    setForm({
      brandId: s.brandId,
      name: s.name,
      slug: s.slug,
      shortDescription: s.shortDescription ?? '',
      description: s.description ?? '',
      category: s.category ?? '',
      priceType: s.priceType as PriceType,
      price: s.price?.toString() ?? '',
      priceMin: s.priceMin?.toString() ?? '',
      priceMax: s.priceMax?.toString() ?? '',
      currency: s.currency,
      durationMinutes: s.durationMinutes?.toString() ?? '',
      location: s.location ?? '',
      isVirtual: s.isVirtual,
      isBookable: s.isBookable,
      isActive: s.isActive,
      sortOrder: s.sortOrder.toString(),
      seoTitle: '',
      seoDescription: '',
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditing(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    saveMutation.mutate({
      brandId: form.brandId,
      name: form.name,
      slug: form.slug || undefined,
      shortDescription: form.shortDescription || undefined,
      description: form.description || undefined,
      category: form.category || undefined,
      priceType: form.priceType,
      price: form.price ? parseFloat(form.price) : undefined,
      priceMin: form.priceMin ? parseFloat(form.priceMin) : undefined,
      priceMax: form.priceMax ? parseFloat(form.priceMax) : undefined,
      currency: form.currency,
      durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : undefined,
      location: form.location || undefined,
      isVirtual: form.isVirtual,
      isBookable: form.isBookable,
      isActive: form.isActive,
      sortOrder: parseInt(form.sortOrder) || 0,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
    })
  }

  function set(key: keyof FormState, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">{services.length} services</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-yoga-700 text-white rounded-xl text-sm font-medium hover:bg-yoga-800 transition-colors"
        >
          <Plus size={16} />
          New Service
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <select
          value={brandFilter}
          onChange={e => setBrandFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yoga-500"
        >
          <option value="">All brands</option>
          {brands.map((b: Brand) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-400 text-sm">Loading...</div>
      ) : services.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-sm">No services found.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Service</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Brand</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Price</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Duration</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{s.name}</div>
                    {s.shortDescription && (
                      <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{s.shortDescription}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{brandName(s.brandId)}</td>
                  <td className="px-4 py-3 text-gray-600">{s.category ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{formatPrice(s)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.durationMinutes ? `${s.durationMinutes}m` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {s.isBookable && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600 w-fit">Bookable</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 text-gray-400 hover:text-yoga-700 transition-colors rounded"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(s.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white h-full w-full max-w-lg overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit Service' : 'New Service'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Brand *</label>
                <select value={form.brandId} onChange={e => set('brandId', e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500">
                  <option value="">Select brand</option>
                  {brands.map((b: Brand) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                  placeholder="60-Minute Swedish Massage" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Slug</label>
                  <input value={form.slug} onChange={e => set('slug', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                    placeholder="auto-generated" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <input value={form.category} onChange={e => set('category', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                    placeholder="Massage" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Short Description</label>
                <input value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                  placeholder="Brief tagline shown in listings" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500 resize-none"
                  placeholder="Full description..." />
              </div>

              {/* Pricing */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price Type *</label>
                <select value={form.priceType} onChange={e => set('priceType', e.target.value as PriceType)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500">
                  {PRICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {form.priceType === 'Fixed' || form.priceType === 'Variable' ? (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price ($)</label>
                  <input type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                    placeholder="90.00" />
                </div>
              ) : form.priceType === 'SlidingScale' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Min Price ($)</label>
                    <input type="number" step="0.01" min="0" value={form.priceMin} onChange={e => set('priceMin', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Price ($)</label>
                    <input type="number" step="0.01" min="0" value={form.priceMax} onChange={e => set('priceMax', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input type="number" min="0" value={form.durationMinutes} onChange={e => set('durationMinutes', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                    placeholder="60" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={e => set('sortOrder', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isVirtual} onChange={e => set('isVirtual', e.target.checked)}
                    className="rounded border-gray-300 text-yoga-600 focus:ring-yoga-500" />
                  <span className="text-sm text-gray-700">Virtual / Online service</span>
                </label>
              </div>

              {!form.isVirtual && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                  <input value={form.location} onChange={e => set('location', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                    placeholder="Studio" />
                </div>
              )}

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isBookable} onChange={e => set('isBookable', e.target.checked)}
                    className="rounded border-gray-300 text-yoga-600 focus:ring-yoga-500" />
                  <span className="text-sm text-gray-700">Bookable</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
                    className="rounded border-gray-300 text-yoga-600 focus:ring-yoga-500" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              {/* SEO */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3">SEO (optional)</p>
                <div className="space-y-3">
                  <input value={form.seoTitle} onChange={e => set('seoTitle', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                    placeholder="SEO Title" />
                  <textarea value={form.seoDescription} onChange={e => set('seoDescription', e.target.value)} rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500 resize-none"
                    placeholder="Meta description" />
                </div>
              </div>
            </form>

            <div className="p-5 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button onClick={closeModal} type="button"
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saveMutation.isPending}
                className="px-5 py-2 bg-yoga-700 text-white rounded-xl text-sm font-medium hover:bg-yoga-800 transition-colors disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4 w-full">
            <h3 className="font-semibold text-gray-900 mb-2">Delete service?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
