'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { servicesApi } from '@/lib/api'
import type { EventOffering } from '@/types'

function formatPrice(offering: EventOffering): string {
  if (offering.priceType === 'Free') return 'Free'
  if (!offering.price) return offering.priceType
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: offering.currency }).format(offering.price)
}

export default function AdminEventsPage() {
  const [brandFilter, setBrandFilter] = useState('')
  const [upcomingOnly, setUpcomingOnly] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-events', brandFilter, upcomingOnly],
    queryFn: () =>
      servicesApi.getEvents({
        brandId: brandFilter || undefined,
        upcomingOnly,
      }).then(r => r.data.data ?? []),
  })

  const events = data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">{events.length} events</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={upcomingOnly}
            onChange={e => setUpcomingOnly(e.target.checked)}
            className="rounded border-gray-300 text-sacred-600 focus:ring-sacred-500"
          />
          Upcoming only
        </label>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-400 text-sm">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-sm">No events found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map(event => (
            <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 leading-snug">{event.name}</h3>
                  {event.instructorName && (
                    <p className="text-xs text-gray-500 mt-0.5">with {event.instructorName}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {event.isFeatured && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Featured</span>
                  )}
                  {event.isSoundOnTheRiver && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Sound on the River</span>
                  )}
                  {event.isSoldOut && (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Sold Out</span>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Date:</span>
                  {new Date(event.startAt).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Time:</span>
                  {new Date(event.startAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  {' – '}
                  {new Date(event.endAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
                {event.venue && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">Venue:</span>
                    {event.venue}
                  </div>
                )}
                {event.city && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">City:</span>
                    {event.city}{event.state ? `, ${event.state}` : ''}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Price:</span>
                  {formatPrice(event)}
                </div>
                {event.capacity && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">Spots:</span>
                    {event.registeredCount} / {event.capacity}
                    {event.spotsRemaining !== undefined && ` (${event.spotsRemaining} remaining)`}
                  </div>
                )}
              </div>

              {event.shortDescription && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{event.shortDescription}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
