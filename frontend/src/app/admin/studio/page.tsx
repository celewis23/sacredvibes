'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { studioApi } from '@/lib/api'
import type { StudioContentItem, StudioTier } from '@/types'

const CATEGORY_LABELS: Record<string, string> = {
  SoundHealing: 'Sound Healing',
  YogaFlows: 'Yoga Flows',
  Breathwork: 'Breathwork',
  GuidedMeditation: 'Guided Meditation',
  CeremoniesAndRituals: 'Ceremonies & Rituals',
  EnergyWork: 'Energy Work',
}

const TIER_BADGE: Record<string, string> = {
  Free:    'bg-sacred-100 text-sacred-600',
  Seeker:  'bg-yoga-100 text-yoga-700',
  Devotee: 'bg-amber-100 text-amber-700',
}

export default function AdminStudioPage() {
  const [items, setItems] = useState<StudioContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    studioApi.adminListContent()
      .then(({ data }) => { if (data.success && data.data) setItems(data.data) })
      .catch(() => toast.error('Failed to load content'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (id: string) => {
    setTogglingId(id)
    try {
      await studioApi.adminTogglePublished(id)
      setItems(prev => prev.map(i => i.id === id ? { ...i, isPublished: !i.isPublished } : i))
    } catch {
      toast.error('Failed to update')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(id)
    try {
      await studioApi.adminDeleteContent(id)
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  // Group by category
  const groups = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
    items: items.filter(i => i.category === key),
  })).filter(g => g.items.length > 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-sacred-900">Digital Studio Content</h1>
          <p className="text-sm text-sacred-500 mt-1">{items.length} total items</p>
        </div>
        <Link href="/admin/studio/new"
          className="px-4 py-2 bg-yoga-600 text-white rounded-lg text-sm font-medium hover:bg-yoga-700 transition-colors">
          + Add Content
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-sacred-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-sacred-200 rounded-2xl">
          <p className="text-sacred-400 font-medium">No content yet</p>
          <Link href="/admin/studio/new" className="text-yoga-600 text-sm mt-2 inline-block hover:underline">
            Add your first session
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(group => (
            <div key={group.key}>
              <h2 className="text-sm font-semibold text-sacred-500 uppercase tracking-wider mb-3">
                {group.label}
              </h2>
              <div className="bg-white rounded-xl border border-sacred-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-sacred-100 text-xs font-medium text-sacred-500 uppercase">
                      <th className="text-left px-4 py-3">Title</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Tier</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Duration</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map(item => (
                      <tr key={item.id} className="border-b border-sacred-50 last:border-0 hover:bg-sacred-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-sacred-900">{item.title}</td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_BADGE[item.requiredTier] ?? ''}`}>
                            {item.requiredTier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sacred-500 hidden md:table-cell">{item.duration ?? '—'}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggle(item.id)}
                            disabled={togglingId === item.id}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                              item.isPublished
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-sacred-100 text-sacred-500 hover:bg-sacred-200'
                            }`}>
                            {togglingId === item.id ? '…' : item.isPublished ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/admin/studio/${item.id}`}
                              className="text-xs text-yoga-600 hover:text-yoga-800 font-medium">
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id, item.title)}
                              disabled={deletingId === item.id}
                              className="text-xs text-red-400 hover:text-red-600 font-medium">
                              {deletingId === item.id ? '…' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
