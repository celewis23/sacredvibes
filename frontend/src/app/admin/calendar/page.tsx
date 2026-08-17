'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameMonth, isToday, startOfMonth, startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'
import { bookingsApi } from '@/lib/api'
import type { Booking, BookingStatus } from '@/types'

const STATUS_DOT: Record<BookingStatus, string> = {
  Pending: 'bg-yellow-500',
  Confirmed: 'bg-blue-500',
  Paid: 'bg-green-500',
  Cancelled: 'bg-gray-400',
  Completed: 'bg-sacred-500',
  Refunded: 'bg-orange-500',
  NoShow: 'bg-red-500',
  Denied: 'bg-rose-500',
}

const STATUS_CHIP: Record<BookingStatus, string> = {
  Pending: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  Confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
  Paid: 'bg-green-50 text-green-800 border-green-200',
  Cancelled: 'bg-gray-50 text-gray-600 border-gray-200',
  Completed: 'bg-sacred-50 text-sacred-800 border-sacred-200',
  Refunded: 'bg-orange-50 text-orange-800 border-orange-200',
  NoShow: 'bg-red-50 text-red-800 border-red-200',
  Denied: 'bg-rose-50 text-rose-800 border-rose-200',
}

function BookingDetailModal({
  booking, onClose, onApprove, onDeny, onReschedule, isMutating,
}: {
  booking: Booking
  onClose: () => void
  onApprove: () => void
  onDeny: () => void
  onReschedule: (newStartAt: string, timeZone: string) => void
  isMutating: boolean
}) {
  const [rescheduling, setRescheduling] = useState(false)
  const current = booking.requestedStartAt ? new Date(booking.requestedStartAt) : new Date()
  const [date, setDate] = useState(current.toISOString().split('T')[0])
  const [time, setTime] = useState(current.toISOString().split('T')[1]?.slice(0, 5) ?? '10:00')

  const submitReschedule = () => {
    const parsed = new Date(`${date}T${time}`)
    if (Number.isNaN(parsed.getTime())) {
      toast.error('Please choose a valid date and time')
      return
    }
    onReschedule(parsed.toISOString(), Intl.DateTimeFormat().resolvedOptions().timeZone)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{booking.customerName}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {booking.serviceOfferingName ?? booking.eventOfferingName ?? booking.bookingType}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CHIP[booking.status]}`}>
            {booking.status}
          </span>
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="text-gray-400">When: </span>
              {booking.requestedStartAt
                ? format(new Date(booking.requestedStartAt), 'EEEE, MMMM d, yyyy · h:mm a')
                : 'Not yet scheduled'}
            </p>
            <p><span className="text-gray-400">Email: </span>{booking.customerEmail}</p>
            {booking.customerPhone && <p><span className="text-gray-400">Phone: </span>{booking.customerPhone}</p>}
            <p>
              <span className="text-gray-400">Amount: </span>
              {booking.amount > 0
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: booking.currency }).format(booking.amount)
                : 'Free'}
            </p>
          </div>

          {booking.status === 'Pending' && rescheduling && (
            <div className="pt-2 space-y-3 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={submitReschedule}
                  disabled={isMutating}
                  className="flex-1 px-3 py-2 bg-sacred-800 text-white text-sm rounded-lg hover:bg-sacred-900 disabled:opacity-50 transition-colors"
                >
                  Send Proposed Time
                </button>
                <button
                  onClick={() => setRescheduling(false)}
                  className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {booking.status === 'Pending' && !rescheduling && (
          <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
            <button
              onClick={onApprove}
              disabled={isMutating}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => setRescheduling(true)}
              className="flex-1 px-3 py-2 text-sacred-700 border border-sacred-300 text-sm rounded-lg hover:bg-sacred-50 transition-colors"
            >
              Reschedule
            </button>
            <button
              onClick={onDeny}
              disabled={isMutating}
              className="flex-1 px-3 py-2 text-red-600 border border-red-200 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Deny
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminCalendarPage() {
  const queryClient = useQueryClient()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selected, setSelected] = useState<Booking | null>(null)

  const gridStart = startOfWeek(startOfMonth(month))
  const gridEnd = endOfWeek(endOfMonth(month))
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-calendar-bookings', gridStart.toISOString(), gridEnd.toISOString()],
    queryFn: () =>
      bookingsApi.getCalendarBookings(gridStart.toISOString(), gridEnd.toISOString()).then(r => r.data.data ?? []),
  })

  const bookings = data ?? []
  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const booking of bookings) {
      if (!booking.requestedStartAt) continue
      const key = new Date(booking.requestedStartAt).toDateString()
      const existing = map.get(key) ?? []
      existing.push(booking)
      map.set(key, existing)
    }
    return map
  }, [bookings])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-calendar-bookings'] })

  const approveMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.adminApprove(id),
    onSuccess: () => { toast.success('Booking approved — payment link sent'); invalidate(); setSelected(null) },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to approve booking'),
  })

  const denyMutation = useMutation({
    mutationFn: (id: string) => bookingsApi.adminDeny(id),
    onSuccess: () => { toast.success('Booking denied — customer notified'); invalidate(); setSelected(null) },
    onError: () => toast.error('Failed to deny booking'),
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, newStartAt, timeZone }: { id: string; newStartAt: string; timeZone: string }) =>
      bookingsApi.adminReschedule(id, newStartAt, undefined, timeZone),
    onSuccess: () => { toast.success('New time proposed — customer notified'); invalidate(); setSelected(null) },
    onError: () => toast.error('Failed to propose new time'),
  })

  const isMutating = approveMutation.isPending || denyMutation.isPending || rescheduleMutation.isPending

  return (
    <div className="p-6 lg:p-8">
      {selected && (
        <BookingDetailModal
          booking={selected}
          onClose={() => setSelected(null)}
          onApprove={() => approveMutation.mutate(selected.id)}
          onDeny={() => denyMutation.mutate(selected.id)}
          onReschedule={(newStartAt, timeZone) => rescheduleMutation.mutate({ id: selected.id, newStartAt, timeZone })}
          isMutating={isMutating}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">Scheduled bookings across services and events</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth(m => addMonths(m, -1))}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setMonth(m => addMonths(m, 1))}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          <span className="ml-2 text-sm font-medium text-gray-700 min-w-[120px]">{format(month, 'MMMM yyyy')}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
        {(Object.keys(STATUS_DOT) as BookingStatus[]).map(status => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[status]}`} />
            {status}
          </span>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="px-2 py-2 text-xs font-medium text-gray-500 text-center">{d}</div>
          ))}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading calendar...</div>
        ) : (
          <div className="grid grid-cols-7">
            {days.map(day => {
              const dayBookings = bookingsByDay.get(day.toDateString()) ?? []
              const visible = dayBookings.slice(0, 3)
              const overflow = dayBookings.length - visible.length

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[110px] border-b border-r border-gray-100 p-1.5 ${
                    isSameMonth(day, month) ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                      isToday(day)
                        ? 'bg-sacred-800 text-white font-medium'
                        : isSameMonth(day, month) ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-1">
                    {visible.map(booking => (
                      <button
                        key={booking.id}
                        onClick={() => setSelected(booking)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] border truncate hover:opacity-80 transition-opacity ${STATUS_CHIP[booking.status]}`}
                        title={`${booking.customerName} — ${booking.serviceOfferingName ?? booking.eventOfferingName ?? booking.bookingType}`}
                      >
                        {booking.requestedStartAt && (
                          <span className="font-medium">{format(new Date(booking.requestedStartAt), 'h:mma')} </span>
                        )}
                        {booking.customerName}
                      </button>
                    ))}
                    {overflow > 0 && (
                      <p className="text-[11px] text-gray-400 px-1.5">+{overflow} more</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
