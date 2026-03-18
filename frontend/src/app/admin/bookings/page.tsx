'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { bookingsApi } from '@/lib/api'
import type { Booking, BookingStatus, PaymentStatus } from '@/types'

const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Paid: 'bg-green-100 text-green-700',
  Cancelled: 'bg-gray-100 text-gray-600',
  Completed: 'bg-sacred-100 text-sacred-700',
  Refunded: 'bg-orange-100 text-orange-700',
  NoShow: 'bg-red-100 text-red-700',
}

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  Pending: 'bg-yellow-50 text-yellow-600',
  Processing: 'bg-blue-50 text-blue-600',
  Completed: 'bg-green-50 text-green-700',
  Failed: 'bg-red-50 text-red-600',
  Refunded: 'bg-orange-50 text-orange-600',
  PartiallyRefunded: 'bg-orange-50 text-orange-600',
  Cancelled: 'bg-gray-50 text-gray-500',
}

interface StatusModalProps {
  booking: Booking
  onClose: () => void
  onSave: (status: string, notes: string) => void
  isPending: boolean
}

function StatusModal({ booking, onClose, onSave, isPending }: StatusModalProps) {
  const [status, setStatus] = useState(booking.status)
  const [notes, setNotes] = useState(booking.adminNotes ?? '')

  const STATUSES: BookingStatus[] = ['Pending', 'Confirmed', 'Paid', 'Cancelled', 'Completed', 'Refunded', 'NoShow']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Update Booking</h2>
          <p className="text-sm text-gray-500 mt-0.5">{booking.customerName} — {booking.brandName}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as BookingStatus)}
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
              placeholder="Internal notes (not shown to customer)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sacred-500"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={() => onSave(status, notes)}
            disabled={isPending}
            className="px-4 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminBookingsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState<Booking | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings', page, statusFilter],
    queryFn: () =>
      bookingsApi.adminGetBookings({
        page,
        pageSize: 20,
        status: statusFilter || undefined,
      }).then(r => r.data.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes: string }) =>
      bookingsApi.adminUpdateStatus(id, status, notes),
    onSuccess: () => {
      toast.success('Booking updated')
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      setEditing(null)
    },
    onError: () => toast.error('Failed to update booking'),
  })

  const bookings = data?.items ?? []
  const total = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 1

  const BOOKING_STATUSES: BookingStatus[] = ['Pending', 'Confirmed', 'Paid', 'Cancelled', 'Completed', 'Refunded', 'NoShow']

  return (
    <div>
      {editing && (
        <StatusModal
          booking={editing}
          onClose={() => setEditing(null)}
          onSave={(status, notes) => updateMutation.mutate({ id: editing.id, status, notes })}
          isPending={updateMutation.isPending}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total bookings</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
        >
          <option value="">All statuses</option>
          {BOOKING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No bookings found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Brand / Service</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Booking Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Payment</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map(booking => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{booking.customerName}</div>
                    <div className="text-xs text-gray-400">{booking.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">{booking.brandName}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[160px]">
                      {booking.serviceOfferingName ?? booking.eventOfferingName ?? booking.bookingType}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BOOKING_STATUS_COLORS[booking.status]}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${PAYMENT_STATUS_COLORS[booking.paymentStatus]}`}>
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {booking.amount > 0
                      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: booking.currency }).format(booking.amount)
                      : 'Free'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(booking)}
                      className="px-2.5 py-1 text-xs text-sacred-700 border border-sacred-300 rounded hover:bg-sacred-50 transition-colors"
                    >
                      Update
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
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
