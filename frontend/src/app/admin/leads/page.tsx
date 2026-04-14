'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { leadsApi } from '@/lib/api'
import type { Lead } from '@/types'

const LEAD_STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700',
  InProgress: 'bg-yellow-100 text-yellow-700',
  Converted: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-600',
  Spam: 'bg-red-100 text-red-600',
}

const STATUSES = ['New', 'InProgress', 'Converted', 'Closed', 'Spam']

interface LeadDetailProps {
  lead: Lead
  onClose: () => void
  onSave: (status: string, notes: string) => void
  isPending: boolean
}

function LeadDetail({ lead, onClose, onSave, isPending }: LeadDetailProps) {
  const [status, setStatus] = useState(lead.status)
  const [notes, setNotes] = useState(lead.adminNotes ?? '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {lead.firstName || lead.lastName
                  ? `${lead.firstName ?? ''} ${lead.lastName ?? ''}`.trim()
                  : 'Anonymous'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">{lead.brandName} · {lead.type}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Contact info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {lead.email && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
                <a href={`mailto:${lead.email}`} className="text-sacred-700 hover:underline">{lead.email}</a>
              </div>
            )}
            {lead.phone && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
                <a href={`tel:${lead.phone}`} className="text-gray-700">{lead.phone}</a>
              </div>
            )}
            {lead.subject && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Subject</p>
                <p className="text-gray-700">{lead.subject}</p>
              </div>
            )}
            {lead.serviceInterest && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Service Interest</p>
                <p className="text-gray-700">{lead.serviceInterest}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Received</p>
              <p className="text-gray-700">{new Date(lead.createdAt).toLocaleString()}</p>
            </div>
            {lead.newsletterOptIn && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Newsletter</p>
                <p className="text-green-600">Opted in</p>
              </div>
            )}
          </div>

          {lead.message && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Message</p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                {lead.message}
              </div>
            </div>
          )}

          {/* Status update */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Internal notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sacred-500"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={() => onSave(status, notes)}
            disabled={isPending}
            className="px-4 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminLeadsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Lead | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-leads', page, statusFilter],
    queryFn: () =>
      leadsApi.adminGetLeads({
        page,
        pageSize: 25,
        status: statusFilter || undefined,
      }).then(r => r.data.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: string; status: string; adminNotes: string }) =>
      leadsApi.adminUpdateLead(id, { status, adminNotes }),
    onSuccess: () => {
      toast.success('Lead updated')
      queryClient.invalidateQueries({ queryKey: ['admin-leads'] })
      setSelected(null)
    },
    onError: () => toast.error('Failed to update lead'),
  })

  const leads = data?.items ?? []
  const total = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="p-6 lg:p-8">
      {selected && (
        <LeadDetail
          lead={selected}
          onClose={() => setSelected(null)}
          onSave={(status, adminNotes) => updateMutation.mutate({ id: selected.id, status, adminNotes })}
          isPending={updateMutation.isPending}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Leads & Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total leads</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
        >
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No leads yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Contact</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Brand</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Newsletter</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Received</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelected(lead)}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {lead.firstName || lead.lastName
                        ? `${lead.firstName ?? ''} ${lead.lastName ?? ''}`.trim()
                        : <span className="text-gray-400">Anonymous</span>}
                    </div>
                    {lead.email && <div className="text-xs text-gray-400">{lead.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{lead.brandName}</td>
                  <td className="px-4 py-3 text-gray-600">{lead.type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${LEAD_STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.newsletterOptIn
                      ? <span className="text-green-600 text-xs">Yes</span>
                      : <span className="text-gray-300 text-xs">No</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setSelected(lead)}
                      className="px-2.5 py-1 text-xs text-sacred-700 border border-sacred-300 rounded hover:bg-sacred-50 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Previous
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
