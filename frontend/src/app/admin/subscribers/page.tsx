'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Users, Upload, Download, Search, ChevronRight, UserPlus, Link2 } from 'lucide-react'
import { format } from 'date-fns'
import { subscribersApi } from '@/lib/api'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Card from '@/components/ui/card'
import ImportModal from '@/components/admin/ImportModal'
import SubscriberEditModal from '@/components/admin/SubscriberEditModal'
import SubscriberAddModal from '@/components/admin/SubscriberAddModal'
import type { Subscriber } from '@/types'

const SIGNUP_LINK = 'https://sacredvibesyoga.com/#newsletter'

export default function SubscribersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importType, setImportType] = useState<'square' | 'stripe' | 'csv'>('csv')
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['subscribers', page, debouncedSearch],
    queryFn: async () => {
      const res = await subscribersApi.getSubscribers({ page, pageSize: 50, search: debouncedSearch || undefined })
      return res.data?.data
    },
  })

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await subscribersApi.exportCsv({ isSubscribed: true })
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `subscribers-${format(new Date(), 'yyyyMMdd')}.csv`
      a.click()
      URL.revokeObjectURL(url)
    },
    onError: () => toast.error('Export failed'),
    onSuccess: () => toast.success('Export downloaded'),
  })

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    clearTimeout((window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer)
    ;(window as unknown as { _searchTimer: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => {
      setDebouncedSearch(e.target.value)
      setPage(1)
    }, 400)
  }

  const openImport = (type: 'square' | 'stripe' | 'csv') => {
    setImportType(type)
    setShowImportModal(true)
  }

  const copySignupLink = async () => {
    try {
      await navigator.clipboard.writeText(SIGNUP_LINK)
      toast.success('Signup link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-display-sm text-sacred-900">Subscribers</h1>
          <p className="text-sm text-sacred-500">
            {data?.totalCount?.toLocaleString() ?? '—'} total subscribers
          </p>
        </div>
        <div className="flex items-center gap-2 flex-nowrap sm:flex-wrap overflow-x-auto sm:overflow-visible -mx-6 px-6 sm:mx-0 sm:px-0 pb-1 sm:pb-0">
          <Button variant="outline" size="sm" onClick={copySignupLink} className="shrink-0">
            <Link2 size={14} /> Copy Signup Link
          </Button>
          <Button variant="outline" size="sm" onClick={() => openImport('csv')} className="shrink-0">
            <Upload size={14} /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => openImport('square')} className="shrink-0">
            Import Square
          </Button>
          <Button variant="outline" size="sm" onClick={() => openImport('stripe')} className="shrink-0">
            Import Stripe
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportMutation.mutate()} isLoading={exportMutation.isPending} className="shrink-0">
            <Download size={14} /> Export
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)} className="shrink-0">
            <UserPlus size={14} /> Add Subscriber
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sacred-400" />
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by email or name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sacred-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yoga-400"
          />
        </div>
      </div>

      {/* Mobile: stacked card list (no horizontal scroll, edit action always visible) */}
      <Card padding="none" className="overflow-hidden sm:hidden">
        {isLoading && (
          <div className="divide-y divide-sacred-50">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="px-4 py-3.5">
                <div className="h-4 bg-sacred-100 rounded animate-pulse w-2/3 mb-2" />
                <div className="h-3 bg-sacred-100 rounded animate-pulse w-1/3" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && (
          <div className="divide-y divide-sacred-50">
            {(data?.items ?? []).map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setEditingSubscriber(sub)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-sacred-50/50 active:bg-sacred-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sacred-900 truncate">{sub.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {sub.fullName && (
                      <span className="text-xs text-sacred-500 truncate">{sub.fullName}</span>
                    )}
                    <Badge variant={sub.isSubscribed ? 'success' : 'neutral'} size="sm" dot>
                      {sub.isSubscribed ? 'Subscribed' : 'Unsubscribed'}
                    </Badge>
                  </div>
                </div>
                <ChevronRight size={18} className="text-sacred-300 shrink-0" />
              </button>
            ))}
          </div>
        )}
        {!isLoading && !data?.items?.length && (
          <div className="px-4 py-12 text-center text-sacred-400">
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p>No subscribers found</p>
          </div>
        )}
      </Card>

      {/* Desktop/tablet: table */}
      <Card padding="none" className="overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sacred-50 border-b border-sacred-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase tracking-wide hidden md:table-cell">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase tracking-wide hidden lg:table-cell">Tags</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase tracking-wide hidden md:table-cell">Joined</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-sacred-50">
              {isLoading && [...Array(10)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-sacred-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
              {!isLoading && (data?.items ?? []).map((sub) => (
                <tr
                  key={sub.id}
                  onClick={() => setEditingSubscriber(sub)}
                  className="hover:bg-sacred-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-sacred-900 max-w-[220px] truncate">{sub.email}</td>
                  <td className="px-4 py-3 text-sacred-600 max-w-[160px] truncate">{sub.fullName || '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant="neutral" size="sm">{sub.source}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {sub.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined, color: tag.color ?? undefined }}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {sub.tags.length > 3 && (
                        <span className="text-xs text-sacred-400">+{sub.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={sub.isSubscribed ? 'success' : 'neutral'} dot>
                      {sub.isSubscribed ? 'Subscribed' : 'Unsubscribed'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sacred-500 hidden md:table-cell">
                    {format(new Date(sub.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight size={16} className="text-sacred-300" />
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.items?.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sacred-400">
                    <Users size={32} className="mx-auto mb-3 opacity-40" />
                    <p>No subscribers found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination — shared across both mobile and desktop layouts */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-sacred-500">
            Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, data.totalCount)} of {data.totalCount}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!data.hasPreviousPage} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!data.hasNextPage} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {showImportModal && (
        <ImportModal
          type={importType}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false)
            qc.invalidateQueries({ queryKey: ['subscribers'] })
            toast.success('Import completed!')
          }}
        />
      )}

      {editingSubscriber && (
        <SubscriberEditModal
          subscriber={editingSubscriber}
          onClose={() => setEditingSubscriber(null)}
        />
      )}

      {showAddModal && (
        <SubscriberAddModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  )
}
