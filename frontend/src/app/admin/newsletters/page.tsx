'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, Newspaper } from 'lucide-react'
import { newslettersApi } from '@/lib/api'
import type { NewsletterStatus } from '@/types'

const TABS: { label: string; value: NewsletterStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Scheduled', value: 'Scheduled' },
  { label: 'Sent', value: 'Sent' },
  { label: 'Cancelled', value: 'Cancelled' },
]

const STATUS_STYLES: Record<NewsletterStatus, string> = {
  Draft: 'bg-sacred-100 text-sacred-600',
  Scheduled: 'bg-yoga-100 text-yoga-700',
  Sending: 'bg-amber-100 text-amber-700',
  Sent: 'bg-green-100 text-green-700',
  SentWithErrors: 'bg-amber-100 text-amber-700',
  Failed: 'bg-red-100 text-red-700',
  Cancelled: 'bg-sacred-100 text-sacred-500',
}

function formatDate(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default function NewslettersPage() {
  const [tab, setTab] = useState<NewsletterStatus | 'all'>('all')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['newsletters', tab],
    queryFn: () => newslettersApi.getAll({ status: tab === 'all' ? undefined : tab, pageSize: 50 }).then(r => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => newslettersApi.delete(id),
    onSuccess: () => {
      toast.success('Newsletter deleted')
      queryClient.invalidateQueries({ queryKey: ['newsletters'] })
    },
    onError: () => toast.error('Could not delete newsletter — it may be currently sending'),
  })

  const items = data?.items ?? []

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-sacred-900">Newsletters</h1>
          <p className="text-sm text-sacred-500 mt-1">Build newsletters ahead of time and schedule them to go out automatically.</p>
        </div>
        <Link
          href="/admin/newsletters/new"
          className="flex items-center gap-2 px-4 py-2 bg-yoga-600 text-white text-sm font-medium rounded-lg hover:bg-yoga-700"
        >
          <Plus size={16} /> New Newsletter
        </Link>
      </div>

      <div className="flex gap-1 border-b border-sacred-200">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.value ? 'border-yoga-600 text-yoga-700' : 'border-transparent text-sacred-500 hover:text-sacred-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-sm text-sacred-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-sacred-200 rounded-xl">
          <Newspaper className="mx-auto mb-3 text-sacred-300" size={32} />
          <p className="text-sm text-sacred-500">No newsletters here yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-sacred-200 rounded-xl divide-y divide-sacred-100">
          {items.map(n => (
            <div key={n.id} className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/newsletters/${n.id}`} className="font-medium text-sacred-900 hover:underline truncate block">
                  {n.name}
                </Link>
                <p className="text-xs text-sacred-500 truncate">{n.subject || '(no subject yet)'}</p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[n.status]}`}>
                {n.status === 'SentWithErrors' ? 'Sent (with errors)' : n.status}
              </span>
              <div className="shrink-0 text-xs text-sacred-500 w-44 text-right">
                {n.status === 'Scheduled' && `Sends ${formatDate(n.scheduledAt)}`}
                {(n.status === 'Sent' || n.status === 'SentWithErrors') && `Sent ${formatDate(n.sentAt)}`}
                {n.status === 'Draft' && 'Not scheduled'}
                {n.status === 'Cancelled' && 'Cancelled'}
                {n.status === 'Sending' && 'Sending now…'}
                {n.status === 'Failed' && 'Failed to send'}
              </div>
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${n.name}"?`)) deleteMutation.mutate(n.id)
                }}
                className="shrink-0 text-sacred-400 hover:text-red-600 p-1"
                title="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
