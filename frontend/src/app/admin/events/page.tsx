'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { offeringsApi, brandsApi } from '@/lib/api'
import type { EventOffering, Brand } from '@/types'

// Convert UTC ISO string to local datetime-local input value
function toLocalInput(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Convert local datetime-local value to UTC ISO string
function fromLocalInput(val: string) {
  if (!val) return new Date().toISOString()
  return new Date(val).toISOString()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

const emptyForm = {
  brandId: '',
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  category: '',
  startAt: '',
  endAt: '',
  timeZone: 'America/New_York',
  venue: '',
  address: '',
  city: 'Asheville',
  state: 'NC',
  isVirtual: false,
  virtualUrl: '',
  capacity: '',
  priceType: 'Fixed',
  price: '',
  currency: 'USD',
  isBookable: true,
  isActive: true,
  isFeatured: false,
  isSoundOnTheRiver: false,
  instructorName: '',
  instructorBio: '',
  externalUrl: '',
  seoTitle: '',
  seoDescription: '',
}

type FormState = typeof emptyForm

export default function AdminEventsPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<EventOffering | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [brandFilter, setBrandFilter] = useState('')
  const [upcomingOnly, setUpcomingOnly] = useState(false)

  const { data: brands = [] } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => brandsApi.getBrands().then(r => r.data.data ?? []),
  })

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin-offerings-events', brandFilter, upcomingOnly],
    queryFn: () => offeringsApi.getEvents({
      brandId: brandFilter || undefined,
      includeInactive: true,
      upcomingOnly,
    }).then(r => r.data.data ?? []),
  })

  const brandName = (id: string) => brands.find((b: Brand) => b.id === id)?.name ?? ''

  const saveMutation = useMutation({
    mutationFn: (data: unknown) => editing
      ? offeringsApi.updateEvent(editing.id, data)
      : offeringsApi.createEvent(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-offerings-events'] })
      toast.success(editing ? 'Event updated' : 'Event created')
      closeModal()
    },
    onError: () => toast.error('Failed to save event'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => offeringsApi.deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-offerings-events'] })
      toast.success('Event deleted')
      setDeleteConfirm(null)
    },
    onError: () => toast.error('Failed to delete event'),
  })

  function openCreate() {
    setEditing(null)
    const now = new Date()
    const start = new Date(now)
    start.setHours(18, 0, 0, 0)
    const end = new Date(start)
    end.setHours(20, 0, 0, 0)
    const toInput = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
    setForm({ ...emptyForm, brandId: brands[0]?.id ?? '', startAt: toInput(start), endAt: toInput(end) })
    setShowModal(true)
  }

  function openEdit(e: EventOffering) {
    setEditing(e)
    setForm({
      brandId: e.brandId,
      name: e.name,
      slug: e.slug,
      shortDescription: e.shortDescription ?? '',
      description: e.description ?? '',
      category: e.category ?? '',
      startAt: toLocalInput(e.startAt),
      endAt: toLocalInput(e.endAt),
      timeZone: e.timeZone ?? 'America/New_York',
      venue: e.venue ?? '',
      address: e.address ?? '',
      city: e.city ?? 'Asheville',
      state: e.state ?? 'NC',
      isVirtual: e.isVirtual,
      virtualUrl: e.virtualUrl ?? '',
      capacity: e.capacity?.toString() ?? '',
      priceType: e.priceType,
      price: e.price?.toString() ?? '',
      currency: e.currency,
      isBookable: e.isBookable,
      isActive: e.isActive,
      isFeatured: e.isFeatured,
      isSoundOnTheRiver: e.isSoundOnTheRiver,
      instructorName: e.instructorName ?? '',
      instructorBio: '',
      externalUrl: '',
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
      startAt: fromLocalInput(form.startAt),
      endAt: fromLocalInput(form.endAt),
      timeZone: form.timeZone,
      venue: form.venue || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      isVirtual: form.isVirtual,
      virtualUrl: form.virtualUrl || undefined,
      capacity: form.capacity ? parseInt(form.capacity) : undefined,
      priceType: form.priceType,
      price: form.price ? parseFloat(form.price) : undefined,
      currency: form.currency,
      isBookable: form.isBookable,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      isSoundOnTheRiver: form.isSoundOnTheRiver,
      instructorName: form.instructorName || undefined,
      instructorBio: form.instructorBio || undefined,
      externalUrl: form.externalUrl || undefined,
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
          <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">{events.length} events</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-yoga-700 text-white rounded-xl text-sm font-medium hover:bg-yoga-800 transition-colors"
        >
          <Plus size={16} />
          New Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
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
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={upcomingOnly}
            onChange={e => setUpcomingOnly(e.target.checked)}
            className="rounded border-gray-300 text-yoga-600 focus:ring-yoga-500"
          />
          Upcoming only
        </label>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-400 text-sm">Loading...</div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-sm">No events found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map(ev => {
            const isPast = new Date(ev.startAt) < new Date()
            return (
              <div key={ev.id} className={`bg-white border rounded-xl p-5 space-y-3 ${isPast ? 'border-gray-100 opacity-70' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 leading-snug truncate">{ev.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{brandName(ev.brandId)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {ev.isFeatured && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Featured</span>}
                    {ev.isSoundOnTheRiver && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">River</span>}
                    {!ev.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Inactive</span>}
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <div>{formatDate(ev.startAt)}</div>
                  {ev.city && <div className="text-xs text-gray-400">{ev.venue ? `${ev.venue} · ` : ''}{ev.city}{ev.state ? `, ${ev.state}` : ''}</div>}
                  {ev.price != null && <div className="font-medium text-gray-800">${ev.price}</div>}
                  {ev.capacity && (
                    <div className="text-xs text-gray-400">{ev.registeredCount} / {ev.capacity} registered</div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => openEdit(ev)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-yoga-700 transition-colors"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <span className="text-gray-200">|</span>
                  <button
                    onClick={() => setDeleteConfirm(ev.id)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white h-full w-full max-w-lg overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
              <h2 className="font-semibold text-gray-900">{editing ? 'Edit Event' : 'New Event'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Event Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                  placeholder="Sound on the River — Summer Session" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <input value={form.category} onChange={e => set('category', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                    placeholder="Sound on the River" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Instructor</label>
                  <input value={form.instructorName} onChange={e => set('instructorName', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                    placeholder="Name" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Short Description</label>
                <input value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                  placeholder="Brief tagline" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500 resize-none" />
              </div>

              {/* Date/Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start *</label>
                  <input type="datetime-local" value={form.startAt} onChange={e => set('startAt', e.target.value)} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End *</label>
                  <input type="datetime-local" value={form.endAt} onChange={e => set('endAt', e.target.value)} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={form.isVirtual} onChange={e => set('isVirtual', e.target.checked)}
                    className="rounded border-gray-300 text-yoga-600 focus:ring-yoga-500" />
                  <span className="text-sm text-gray-700">Virtual event</span>
                </label>
                {form.isVirtual ? (
                  <input value={form.virtualUrl} onChange={e => set('virtualUrl', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                    placeholder="Meeting URL" />
                ) : (
                  <div className="space-y-2">
                    <input value={form.venue} onChange={e => set('venue', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                      placeholder="Venue name" />
                    <input value={form.address} onChange={e => set('address', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                      placeholder="Street address" />
                    <div className="grid grid-cols-2 gap-2">
                      <input value={form.city} onChange={e => set('city', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                        placeholder="City" />
                      <input value={form.state} onChange={e => set('state', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                        placeholder="State" />
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing & Capacity */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price Type</label>
                  <select value={form.priceType} onChange={e => set('priceType', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500">
                    {['Fixed', 'Free', 'Donation', 'Variable'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {form.priceType !== 'Free' && form.priceType !== 'Donation' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price ($)</label>
                    <input type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Capacity</label>
                  <input type="number" min="0" value={form.capacity} onChange={e => set('capacity', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                    placeholder="∞" />
                </div>
              </div>

              {/* Flags */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  { key: 'isBookable', label: 'Bookable' },
                  { key: 'isActive', label: 'Active' },
                  { key: 'isFeatured', label: 'Featured' },
                  { key: 'isSoundOnTheRiver', label: 'Sound on the River' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox"
                      checked={form[key as keyof FormState] as boolean}
                      onChange={e => set(key as keyof FormState, e.target.checked)}
                      className="rounded border-gray-300 text-yoga-600 focus:ring-yoga-500" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">External URL</label>
                <input value={form.externalUrl} onChange={e => set('externalUrl', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                  placeholder="Eventbrite / Meetup link (optional)" />
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
                {saveMutation.isPending ? 'Saving…' : editing ? 'Save Changes' : 'Create Event'}
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
            <h3 className="font-semibold text-gray-900 mb-2">Delete event?</h3>
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
