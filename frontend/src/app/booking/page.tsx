'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { servicesApi, bookingsApi } from '@/lib/api'
import { getBrandConfigBySlug } from '@/lib/brand/resolution'
import type { ServiceOffering, EventOffering } from '@/types'

const schema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().email('Valid email required'),
  customerPhone: z.string().optional(),
  customerNotes: z.string().max(500).optional(),
})

type FormData = z.infer<typeof schema>

function BookingForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const serviceId = searchParams.get('serviceId')
  const eventId = searchParams.get('eventId')

  const [service, setService] = useState<ServiceOffering | null>(null)
  const [event, setEvent] = useState<EventOffering | null>(null)
  const [step, setStep] = useState<'form' | 'processing' | 'error'>('form')
  const [errorMsg, setErrorMsg] = useState('')

  // Detect brand from subdomain (client-side fallback)
  const brandConfig = getBrandConfigBySlug('sacred-hands')

  useEffect(() => {
    if (serviceId) {
      servicesApi.getServices().then(r => {
        const found = (r.data.data ?? []).find(s => s.id === serviceId)
        if (found) setService(found)
      }).catch(() => {})
    }
    if (eventId) {
      servicesApi.getEvents().then(r => {
        const found = (r.data.data ?? []).find(e => e.id === eventId)
        if (found) setEvent(found)
      }).catch(() => {})
    }
  }, [serviceId, eventId])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const offering = service ?? event
  const price = offering?.price ?? 0
  const currency = offering?.currency ?? 'USD'
  const isFree = offering?.priceType === 'Free' || price === 0

  const onSubmit = async (data: FormData) => {
    setStep('processing')
    try {
      const bookingRes = await bookingsApi.createBooking({
        brandId: brandConfig.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerNotes: data.customerNotes,
        bookingType: service ? 'MassageService' : 'SoundHealingEvent',
        serviceOfferingId: serviceId ?? undefined,
        eventOfferingId: eventId ?? undefined,
        amount: price,
        currency,
      })

      const booking = bookingRes.data.data
      if (!booking) throw new Error('No booking returned')

      if (!isFree && price > 0) {
        const origin = window.location.origin
        const checkoutRes = await bookingsApi.createCheckout(
          booking.id,
          `${origin}/booking/confirmation?bookingId=${booking.id}`,
          `${origin}/booking?serviceId=${serviceId ?? ''}&eventId=${eventId ?? ''}`
        )
        const checkoutUrl = checkoutRes.data.data?.checkoutUrl
        if (checkoutUrl) {
          window.location.href = checkoutUrl
          return
        }
      }

      router.push(`/booking/confirmation?bookingId=${booking.id}`)
    } catch (err) {
      setStep('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      toast.error('Booking failed')
    }
  }

  if (step === 'processing') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sacred-200 border-t-sacred-700 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sacred-600">Processing your booking...</p>
        </div>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="font-heading text-2xl text-sacred-900 mb-3">Something went wrong</p>
          <p className="text-sacred-600 mb-6">{errorMsg}</p>
          <button
            onClick={() => setStep('form')}
            className="px-6 py-2.5 bg-sacred-800 text-white rounded-full text-sm hover:bg-sacred-900 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="section">
      <div className="container-sacred">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="font-heading text-4xl text-sacred-900 mb-2">Book a Session</h1>
            {offering && (
              <div className="bg-sacred-50 rounded-xl p-4 mt-4">
                <p className="font-medium text-sacred-900">{offering.name}</p>
                <div className="flex gap-4 text-sm text-sacred-600 mt-1">
                  {price > 0 ? (
                    <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price)}</span>
                  ) : (
                    <span>Free</span>
                  )}
                  {service?.durationMinutes && <span>{service.durationMinutes} min</span>}
                  {'startAt' in (event ?? {}) && event && (
                    <span>{new Date(event.startAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white border border-sacred-100 rounded-2xl p-8">
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

            <div>
              <label className="block text-sm font-medium text-sacred-800 mb-1">Notes for Your Practitioner</label>
              <textarea
                rows={4}
                {...register('customerNotes')}
                placeholder="Any injuries, areas of focus, preferences, or questions..."
                className="w-full px-4 py-2.5 border border-sacred-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sacred-500"
              />
            </div>

            <div className="pt-2">
              {!isFree ? (
                <p className="text-xs text-sacred-500 mb-4">
                  You&apos;ll be taken to our secure Square checkout after submitting.
                </p>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-sacred-800 text-white font-medium rounded-full hover:bg-sacred-900 disabled:opacity-50 transition-colors"
              >
                {isSubmitting
                  ? 'Submitting...'
                  : isFree
                    ? 'Confirm Booking'
                    : `Proceed to Payment — ${new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price)}`}
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
      <BookingForm />
    </Suspense>
  )
}
