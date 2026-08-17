'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Clock, Calendar, MapPin, Users, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { servicesApi, bookingsApi } from '@/lib/api'
import { getBrandConfigBySlug, getBrandSlugFromPathname, toBrandPath, formatPrice } from '@/lib/brand/resolution'
import type { ServiceOffering, EventOffering } from '@/types'

const schema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().email('Valid email required'),
  customerPhone: z.string().optional(),
  customerNotes: z.string().max(500).optional(),
  requestedDate: z.string().optional(),
  requestedTime: z.string().optional(),
  website: z.string().optional(),
})

type FormData = z.infer<typeof schema>
type Stage = 'select' | 'form' | 'processing' | 'error'

// ── Carousel wrapper ──────────────────────────────────────────────────────────

function CarouselSection({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (count === 0) return null

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl text-sacred-800">{title}</h2>
        {count > 2 && (
          <div className="flex gap-1.5">
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
              className="p-1.5 rounded-full border border-sacred-200 text-sacred-500 hover:bg-sacred-50 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
              className="p-1.5 rounded-full border border-sacred-200 text-sacred-500 hover:bg-sacred-50 transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3"
        style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Service card (selectable) ─────────────────────────────────────────────────

function ServiceSelectCard({
  service,
  onSelect,
}: {
  service: ServiceOffering
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className="group text-left shrink-0 w-64 sm:w-72 flex flex-col rounded-2xl border border-sacred-100 bg-white p-5 hover:border-sacred-300 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sacred-500"
      style={{ scrollSnapAlign: 'start' }}
    >
      {service.featuredImageUrl ? (
        <div className="w-full h-36 rounded-xl overflow-hidden mb-4 bg-sacred-50 shrink-0">
          <img
            src={service.featuredImageUrl}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-full h-28 rounded-xl bg-gradient-to-br from-sacred-50 to-sacred-100 mb-4 shrink-0 flex items-center justify-center">
          <span className="text-3xl opacity-50">🪷</span>
        </div>
      )}

      {service.category && (
        <p className="text-xs font-semibold tracking-widest uppercase text-sacred-400 mb-1">
          {service.category}
        </p>
      )}
      <h3 className="font-heading text-lg text-sacred-900 leading-snug mb-1 flex-1">{service.name}</h3>
      {service.shortDescription && (
        <p className="text-xs text-sacred-500 leading-relaxed mb-3 line-clamp-3">{service.shortDescription}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-sacred-100 mt-auto">
        <div>
          <p className="font-semibold text-sm text-sacred-800">
            {formatPrice(service.price, service.priceType, service.currency)}
          </p>
          {service.durationMinutes && (
            <p className="flex items-center gap-1 text-xs text-sacred-400 mt-0.5">
              <Clock size={11} />
              {service.durationMinutes} min
            </p>
          )}
        </div>
        <span className="text-xs font-medium text-white bg-sacred-700 group-hover:bg-sacred-800 px-3 py-1.5 rounded-full transition-colors">
          Select
        </span>
      </div>
    </button>
  )
}

// ── Event card (selectable) ───────────────────────────────────────────────────

function EventSelectCard({
  event,
  onSelect,
}: {
  event: EventOffering
  onSelect: () => void
}) {
  const startDate = new Date(event.startAt)

  const cardContent = (
    <>
      {event.featuredImageUrl ? (
        <div className="w-full h-36 rounded-xl overflow-hidden mb-4 bg-sacred-50 shrink-0">
          <img
            src={event.featuredImageUrl}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-full h-28 rounded-xl bg-gradient-to-br from-sound-950 to-indigo-900 mb-4 shrink-0 flex items-center justify-center">
          <span className="text-3xl opacity-60">🎵</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-heading text-lg text-sacred-900 leading-snug flex-1">{event.name}</h3>
        {event.isSoldOut && (
          <span className="shrink-0 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            Sold Out
          </span>
        )}
      </div>

      <div className="space-y-1 mb-3 flex-1">
        <p className="flex items-center gap-1.5 text-xs text-sacred-500">
          <Calendar size={11} className="shrink-0" />
          {format(startDate, 'EEE, MMM d')} · {format(startDate, 'h:mm a')}
        </p>
        {(event.venue || event.city) && (
          <p className="flex items-center gap-1.5 text-xs text-sacred-500">
            <MapPin size={11} className="shrink-0" />
            {[event.venue, event.city].filter(Boolean).join(', ')}
          </p>
        )}
        {event.spotsRemaining != null && !event.isSoldOut && (
          <p className="flex items-center gap-1.5 text-xs text-sacred-500">
            <Users size={11} className="shrink-0" />
            {event.spotsRemaining} spots remaining
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-sacred-100 mt-auto">
        <p className="font-semibold text-sm text-sacred-800">
          {formatPrice(event.price, event.priceType, event.currency)}
        </p>
        {!event.isSoldOut && (
          <span className="text-xs font-medium text-white bg-sacred-700 group-hover:bg-sacred-800 px-3 py-1.5 rounded-full transition-colors">
            Select
          </span>
        )}
      </div>
    </>
  )

  if (event.isSoldOut) {
    return (
      <div
        className="text-left shrink-0 w-64 sm:w-72 flex flex-col rounded-2xl border border-sacred-100 bg-white p-5 opacity-50 cursor-not-allowed"
        style={{ scrollSnapAlign: 'start' }}
      >
        {cardContent}
      </div>
    )
  }

  return (
    <button
      onClick={onSelect}
      className="group text-left shrink-0 w-64 sm:w-72 flex flex-col rounded-2xl border border-sacred-100 bg-white p-5 hover:border-sacred-300 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sacred-500"
      style={{ scrollSnapAlign: 'start' }}
    >
      {cardContent}
    </button>
  )
}

// ── Main booking component ────────────────────────────────────────────────────

function BookingInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const brandSlug = getBrandSlugFromPathname(pathname) ?? 'sacred-vibes-yoga'
  const brandConfig = getBrandConfigBySlug(brandSlug)

  const [stage, setStage] = useState<Stage>('select')
  const [services, setServices] = useState<ServiceOffering[]>([])
  const [events, setEvents] = useState<EventOffering[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<ServiceOffering | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventOffering | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    Promise.all([
      servicesApi.getServices({ brandId: brandConfig.id }),
      servicesApi.getEvents({ brandId: brandConfig.id, upcomingOnly: true }),
    ])
      .then(([sRes, eRes]) => {
        const svcs = (sRes.data.data ?? []).filter(s => s.isBookable && s.isActive)
        const evts = eRes.data.data ?? []
        setServices(svcs)
        setEvents(evts)

        // Support both ?serviceId= and legacy ?service= from ServiceCard links
        const sid = searchParams.get('serviceId') ?? searchParams.get('service')
        const eid = searchParams.get('eventId') ?? searchParams.get('event')
        if (sid) {
          const found = svcs.find(s => s.id === sid)
          if (found) { setSelectedService(found); setStage('form') }
        } else if (eid) {
          const found = evts.find(e => e.id === eid)
          if (found) { setSelectedEvent(found); setStage('form') }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [brandConfig.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const offering = selectedService ?? selectedEvent
  const price = offering?.price ?? 0
  const currency = offering?.currency ?? 'USD'
  const isFree = !offering || offering.priceType === 'Free' || price === 0
  const bookingType = selectedService
    ? brandSlug === 'sacred-hands'
      ? 'MassageService'
      : brandSlug === 'sacred-sound'
        ? 'SoundHealingClass'
        : 'YogaClass'
    : brandSlug === 'sacred-sound'
      ? 'SoundHealingEvent'
      : 'YogaEvent'

  function selectService(s: ServiceOffering) {
    setSelectedService(s)
    setSelectedEvent(null)
    setStage('form')
  }

  function selectEvent(e: EventOffering) {
    setSelectedEvent(e)
    setSelectedService(null)
    setStage('form')
  }

  function goBack() {
    setStage('select')
    setSelectedService(null)
    setSelectedEvent(null)
    reset()
  }

  const onSubmit = async (data: FormData) => {
    if (!offering) return

    let requestedStartAt: string | undefined
    if (selectedService) {
      if (!data.requestedDate || !data.requestedTime) {
        setError('requestedDate', { message: 'Please choose a date and time' })
        return
      }
      const parsed = new Date(`${data.requestedDate}T${data.requestedTime}`)
      if (Number.isNaN(parsed.getTime())) {
        setError('requestedDate', { message: 'Please choose a valid date and time' })
        return
      }
      requestedStartAt = parsed.toISOString()
    }

    setStage('processing')
    try {
      const bookingRes = await bookingsApi.createBooking({
        brandId: brandConfig.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerNotes: data.customerNotes,
        bookingType,
        serviceOfferingId: selectedService?.id,
        eventOfferingId: selectedEvent?.id,
        amount: price,
        currency,
        requestedStartAt,
        requestedTimeZone: selectedService ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
        website: data.website,
      })

      const booking = bookingRes.data.data
      if (!booking) throw new Error('No booking returned')

      router.push(toBrandPath(brandSlug, `/booking/confirmation?bookingId=${booking.id}`))
    } catch (err) {
      setStage('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      toast.error('Booking failed')
    }
  }

  // ── Processing ────────────────────────────────────────────────────────────

  if (stage === 'processing') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sacred-200 border-t-sacred-700 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sacred-600">Processing your booking…</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (stage === 'error') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="font-heading text-2xl text-sacred-900 mb-3">Something went wrong</p>
          <p className="text-sacred-600 mb-6">{errorMsg}</p>
          <button
            onClick={() => { setStage('form'); setErrorMsg('') }}
            className="px-6 py-2.5 bg-sacred-800 text-white rounded-full text-sm hover:bg-sacred-900 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ── Service / event selection ─────────────────────────────────────────────

  if (stage === 'select') {
    return (
      <main className="section">
        <div className="container-sacred max-w-5xl mx-auto">
          <div className="mb-10">
            <h1 className="font-heading text-4xl text-sacred-900 mb-2">Book a Session</h1>
            <p className="text-sacred-500 text-sm">Choose a service or upcoming event to get started.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-10 h-10 border-4 border-sacred-200 border-t-sacred-700 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <CarouselSection title="Services" count={services.length}>
                {services.map(s => (
                  <ServiceSelectCard key={s.id} service={s} onSelect={() => selectService(s)} />
                ))}
              </CarouselSection>

              <CarouselSection title="Upcoming Events" count={events.filter(e => e.isBookable || e.isSoldOut).length}>
                {events.map(e => (
                  <EventSelectCard key={e.id} event={e} onSelect={() => selectEvent(e)} />
                ))}
              </CarouselSection>

              {services.length === 0 && events.length === 0 && (
                <div className="text-center py-20 text-sacred-500">
                  <p className="mb-4">No bookable offerings available right now.</p>
                  <Link href="/contact" className="text-sm underline hover:text-sacred-800 transition-colors">
                    Contact us to schedule
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    )
  }

  // ── Details form ──────────────────────────────────────────────────────────

  return (
    <main className="section">
      <div className="container-sacred">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm text-sacred-500 hover:text-sacred-800 mb-6 transition-colors"
          >
            <ArrowLeft size={15} />
            Change selection
          </button>

          {/* Selected offering summary */}
          {offering && (
            <div className="bg-sacred-50 border border-sacred-100 rounded-2xl p-5 mb-8 flex items-start gap-4">
              {offering.featuredImageUrl && (
                <img
                  src={offering.featuredImageUrl}
                  alt={offering.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-heading text-lg text-sacred-900 leading-snug">{offering.name}</p>
                <div className="flex flex-wrap gap-3 text-sm text-sacred-500 mt-1">
                  <span className="font-semibold text-sacred-700">
                    {formatPrice(offering.price, offering.priceType, offering.currency)}
                  </span>
                  {selectedService?.durationMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {selectedService.durationMinutes} min
                    </span>
                  )}
                  {selectedEvent && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(selectedEvent.startAt), 'EEEE, MMM d · h:mm a')}
                    </span>
                  )}
                  {selectedEvent?.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {selectedEvent.venue}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <h2 className="font-heading text-2xl text-sacred-900 mb-6">Your Details</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white border border-sacred-100 rounded-2xl p-8">
            {/* Honeypot — visually hidden; humans leave this blank */}
            <div style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0, overflow: 'hidden' }} aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-sacred-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  autoComplete="name"
                  {...register('customerName')}
                  className="w-full px-4 py-2.5 border border-sacred-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                />
                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-sacred-800 mb-1">Email *</label>
                <input
                  type="email"
                  autoComplete="email"
                  {...register('customerEmail')}
                  className="w-full px-4 py-2.5 border border-sacred-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                />
                {errors.customerEmail && <p className="text-red-500 text-xs mt-1">{errors.customerEmail.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-sacred-800 mb-1">Phone</label>
                <input
                  type="tel"
                  autoComplete="tel"
                  {...register('customerPhone')}
                  className="w-full px-4 py-2.5 border border-sacred-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                />
              </div>
            </div>

            {selectedService && (
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-sacred-800 mb-1">Preferred Date *</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    {...register('requestedDate')}
                    className="w-full px-4 py-2.5 border border-sacred-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                  />
                  {errors.requestedDate && <p className="text-red-500 text-xs mt-1">{errors.requestedDate.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-sacred-800 mb-1">Preferred Time *</label>
                  <input
                    type="time"
                    {...register('requestedTime')}
                    className="w-full px-4 py-2.5 border border-sacred-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sacred-500"
                  />
                </div>
                <p className="sm:col-span-2 text-xs text-sacred-500 -mt-1">
                  This is your requested time — we&apos;ll confirm availability before your booking is finalized.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-sacred-800 mb-1">Notes for Your Practitioner</label>
              <textarea
                rows={4}
                {...register('customerNotes')}
                placeholder="Any injuries, areas of focus, preferences, or questions…"
                className="w-full px-4 py-2.5 border border-sacred-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sacred-500"
              />
            </div>

            <div className="pt-2">
              {!isFree && (
                <p className="text-xs text-sacred-500 mb-4">
                  We&apos;ll review your request and, once approved, email you a secure payment link to confirm your {formatPrice(price, offering?.priceType ?? 'Fixed', currency)} booking.
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-sacred-800 text-white font-medium rounded-full hover:bg-sacred-900 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Submitting…' : isFree ? 'Confirm Booking' : 'Request Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sacred-200 border-t-sacred-700 rounded-full animate-spin" />
      </div>
    }>
      <BookingInner />
    </Suspense>
  )
}
