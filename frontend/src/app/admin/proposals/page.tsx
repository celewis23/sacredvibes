'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, FileSignature, Eye } from 'lucide-react'
import { proposalsApi } from '@/lib/api'
import type { ProposalStatus } from '@/types'

const TABS: { label: string; value: ProposalStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Sent', value: 'Sent' },
]

const STATUS_STYLES: Record<ProposalStatus, string> = {
  Draft: 'bg-sacred-100 text-sacred-600',
  Sent: 'bg-green-100 text-green-700',
}

function formatDate(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function formatCurrency(amount: number) {
  return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

export default function ProposalsPage() {
  const [tab, setTab] = useState<ProposalStatus | 'all'>('all')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['proposals', tab],
    queryFn: () => proposalsApi.getAll({ status: tab === 'all' ? undefined : tab, pageSize: 50 }).then(r => r.data.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => proposalsApi.delete(id),
    onSuccess: () => {
      toast.success('Proposal deleted')
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
    },
    onError: () => toast.error('Could not delete proposal'),
  })

  const items = data?.items ?? []

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-sacred-900">Proposals</h1>
          <p className="text-sm text-sacred-500 mt-1">Build client proposals with pricing, images and video, then send them when ready.</p>
        </div>
        <Link
          href="/admin/proposals/new"
          className="flex items-center gap-2 px-4 py-2 bg-yoga-600 text-white text-sm font-medium rounded-lg hover:bg-yoga-700"
        >
          <Plus size={16} /> New Proposal
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
          <FileSignature className="mx-auto mb-3 text-sacred-300" size={32} />
          <p className="text-sm text-sacred-500">No proposals here yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-sacred-200 rounded-xl overflow-x-auto">
          <div className="divide-y divide-sacred-100 min-w-[680px]">
            {items.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/proposals/${p.id}`} className="font-medium text-sacred-900 hover:underline truncate block">
                    {p.title}
                  </Link>
                  <p className="text-xs text-sacred-500 truncate">
                    {p.recipientName || p.recipientEmail || 'No recipient yet'}
                  </p>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[p.status]}`}>
                  {p.status}
                </span>
                <div className="shrink-0 text-xs text-sacred-500 w-24 text-right">{formatCurrency(p.total)}</div>
                <div className="shrink-0 text-xs text-sacred-500 w-44 text-right">
                  {p.status === 'Sent' ? `Sent ${formatDate(p.sentAt)}` : 'Not sent yet'}
                </div>
                {p.status === 'Sent' && (
                  <div className="shrink-0 flex items-center gap-1 text-xs text-sacred-400 w-16" title="Times viewed online">
                    <Eye size={13} /> {p.viewCount}
                  </div>
                )}
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${p.title}"?`)) deleteMutation.mutate(p.id)
                  }}
                  className="shrink-0 text-sacred-400 hover:text-red-600 p-1"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
