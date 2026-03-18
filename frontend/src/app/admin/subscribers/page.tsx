'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Users, Upload, Download, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { subscribersApi } from '@/lib/api'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Card from '@/components/ui/card'
import ImportModal from '@/components/admin/ImportModal'

export default function SubscribersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [importType, setImportType] = useState<'square' | 'stripe' | 'csv'>('csv')

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
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => openImport('csv')}>
            <Upload size={14} /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => openImport('square')}>
            Import Square
          </Button>
          <Button variant="outline" size="sm" onClick={() => openImport('stripe')}>
            Import Stripe
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportMutation.mutate()} isLoading={exportMutation.isPending}>
            <Download size={14} /> Export
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

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sacred-50 border-b border-sacred-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase tracking-wide hidden sm:table-cell">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase tracking-wide hidden md:table-cell">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase tracking-wide hidden lg:table-cell">Tags</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-sacred-500 uppercase tracking-wide hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sacred-50">
              {isLoading && [...Array(10)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-sacred-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
              {!isLoading && (data?.items ?? []).map((sub) => (
                <tr key={sub.id} className="hover:bg-sacred-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-sacred-900">{sub.email}</td>
                  <td className="px-4 py-3 text-sacred-600 hidden sm:table-cell">{sub.fullName || '—'}</td>
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
                </tr>
              ))}
              {!isLoading && !data?.items?.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sacred-400">
                    <Users size={32} className="mx-auto mb-3 opacity-40" />
                    <p>No subscribers found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-sacred-100">
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
      </Card>

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
    </div>
  )
}
