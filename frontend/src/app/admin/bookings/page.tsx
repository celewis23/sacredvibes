'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { bookingsApi } from '@/lib/api'
import type { Booking, BookingStatus, PaymentStatus, ServiceOffering, EventOffering } from '@/types'

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

interface BookingModalProps {
  booking: Booking
  onClose: () => void
  onSaveStatus: (status: string, notes: string) => void
  onSaveRebook: (data: { serviceOfferingId?: string | null; eventOfferingId?: string | null; bookingType?: string; amount?: number }) => void
  onDelete: () => void
  isStatusPending: boolean
  isRebookPending: boolean
  isDeletePending: boolean
}

function BookingModal({ booking, onClose, onSaveStatus, onSaveRebook, onDelete, isStatusPending, isRebookPending, isDeletePending }: BookingModalProps) {
  const [tab, setTab] = useState<'status' | 'rebook'>('status')
  const [status, setStatus] = useState(booking.status)
  const [notes, setNotes] = useState(booking.adminNotes ?? '')
  const [serviceId, setServiceId] = useState(booking.serviceOfferingId ?? '')
  const [eventId, setEventId] = useState(booking.eventOfferingId ?? '')
  const [amount, setAmount] = useState(booking.amount.toString())
  const [confirmDelete, setConfirmDelete] = useState(false)

  const STATUSES: BookingStatus[] = ['Pending', 'Confirmed', 'Paid', 'Cancelled', 'Completed', 'Refunded', 'NoShow']

  const { data: servicesData } = useQuery({
    queryKey: ['booking-services-all'],
    queryFn: () => bookingsApi.getServices().then(r => r.data.data ?? []),
    enabled: tab === 'rebook',
  })

  const { data: eventsData } = useQuery({
    queryKey: ['booking-events-all'],
    queryFn: () => bookingsApi.getEvents().then(r => r.data.data ?? []),
    enabled: tab === 'rebook',
  })

  const services = servicesData ?? []
  const events = eventsData ?? []

  const handleRebook = () => {
    onSaveRebook({
      serviceOfferingId: serviceId || null,
      eventOfferingId: eventId || null,
      amount: parseFloat(amount) || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Manage Booking</h2>
            <p className="text-sm text-gray-500 mt-0.5">{booking.customerName} — {booking.brandName}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {booking.serviceOfferingName ?? booking.eventOfferingName ?? booking.bookingType}
            </p>
          </div>
          {confirmDelete ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-red-600 font-medium">Delete?</span>
              <button
                onClick={onDelete}
                disabled={isDeletePending}
                className="px-2.5 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeletePending ? '...' : 'Yes'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="mt-1 px-2.5 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="px-6 flex gap-4 border-b border-gray-100">
          {(['status', 'rebook'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-sacred-700 text-sacred-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'status' ? 'Status & Notes' : 'Change Service'}
            </button>
          ))}
        </div>

        {tab === 'status' ? (
          <>
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
                onClick={() => onSaveStatus(status, notes)}
                disabled={isStatusPending}
                className="px-4 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 disabled:opacity-50 transition-colors"
              >
                {isStatusPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-400">
                Select a new service or event to reassign this booking. The customer will receive an email notification.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <select
                  value={serviceId}
                  onChange={e => { setServiceId(e.target.value); if (e.target.value) setEventId('') }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                >
                  <option value="">— No service —</option>
                  {services.filter(s => s.isBookable).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.category ? ` · ${s.category}` : ''}{s.price ? ` ($${s.price})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {events.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Or Event</label>
                  <select
                    value={eventId}
                    onChange={e => { setEventId(e.target.value); if (e.target.value) setServiceId('') }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                  >
                    <option value="">— No event —</option>
                    {events.filter(e => e.isBookable && !e.isSoldOut).map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} — {new Date(e.startAt).toLocaleDateString()}
                        {e.price ? ` ($${e.price})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button
                onClick={handleRebook}
                disabled={isRebookPending || (!serviceId && !eventId)}
                className="px-4 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 disabled:opacity-50 transition-colors"
              >
                {isRebookPending ? 'Saving...' : 'Update Booking'}
              </button>
            </div>
          </>
        )}
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

  const rebookMutation = useMutation({
    mutationFn: ({ id, data }: {
      id: string
      data: { serviceOfferingId?: string | null; eventOfferingId?: string | null; bookingType?: string; amount?: number }
    }) => bookingsApi.adminUpdateBooking(id, data),
    onSuccess: () => {
      toast.success('Booking reassigned — customer notified')
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      setEditing(null)
    },
    onError: () => toast.error('Failed to update booking'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.adminDeleteBooking(id),
    onSuccess: () => {
      toast.success('Booking deleted')
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      setEditing(null)
    },
    onError: () => toast.error('Failed to delete booking'),
  })

  const bookings = data?.items ?? []
  const total = data?.totalCount ?? 0
  const totalPages = data?.totalPages ?? 1

  const BOOKING_STATUSES: BookingStatus[] = ['Pending', 'Confirmed', 'Paid', 'Cancelled', 'Completed', 'Refunded', 'NoShow']

  return (
    <div className="p-6 lg:p-8">
      {editing && (
        <BookingModal
          booking={editing}
          onClose={() => setEditing(null)}
          onSaveStatus={(status, notes) => updateMutation.mutate({ id: editing.id, status, notes })}
          onSaveRebook={(data) => rebookMutation.mutate({ id: editing.id, data })}
          onDelete={() => deleteMutation.mutate(editing.id)}
          isStatusPending={updateMutation.isPending}
          isRebookPending={rebookMutation.isPending}
          isDeletePending={deleteMutation.isPending}
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
          <>
            <div className="divide-y divide-gray-100 md:hidden">
              {bookings.map(booking => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => setEditing(booking)}
                  className="block w-full px-4 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{booking.customerName}</div>
                      <div className="text-xs text-gray-400 truncate">{booking.customerEmail}</div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BOOKING_STATUS_COLORS[booking.status]}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between gap-3">
                      <span className="truncate">{booking.brandName}</span>
                      <span className="shrink-0">{new Date(booking.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="truncate">{booking.serviceOfferingName ?? booking.eventOfferingName ?? booking.bookingType}</span>
                      <span className="shrink-0 font-medium text-gray-700">
                        {booking.amount > 0
                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: booking.currency }).format(booking.amount)
                          : 'Free'}
                      </span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${PAYMENT_STATUS_COLORS[booking.paymentStatus]}`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <table className="hidden w-full text-sm md:table">
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
                <tr
                  key={booking.id}
                  onClick={() => setEditing(booking)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
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
                      onClick={(e) => { e.stopPropagation(); setEditing(booking) }}
                      className="px-2.5 py-1 text-xs text-sacred-700 border border-sacred-300 rounded hover:bg-sacred-50 transition-colors"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </>
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
