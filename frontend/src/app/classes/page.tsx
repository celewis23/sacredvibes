import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Clock, Calendar, MapPin, Users } from 'lucide-react'
import { getCurrentBrand } from '@/lib/brand/current'
import { servicesApi } from '@/lib/api'
import type { ServiceOffering, EventOffering } from '@/types'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Experiences & Schedule',
    description: 'Yoga classes, sound healing sessions, workshops, and sacred events for every level of practice.',
  }
}

function formatPrice(s: ServiceOffering | EventOffering): string {
  if (s.priceType === 'Free') return 'Free'
  if (s.priceType === 'Donation') return 'By donation'
  if ('priceMin' in s && s.priceType === 'SlidingScale' && s.priceMin != null && s.priceMax != null) {
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: s.currency }).format(n)
    return `${fmt(s.priceMin)} – ${fmt(s.priceMax)}`
  }
  if (s.price) return new Intl.NumberFormat('en-US', { style: 'currency', currency: s.currency }).format(s.price)
  return 'Contact us'
}

export default async function ClassesPage() {
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)

  const [servicesRes, eventsRes] = await Promise.allSettled([
    servicesApi.getServices({ brandId: brand.id }),
    servicesApi.getEvents({ brandId: brand.id, upcomingOnly: true }),
  ])

  const services: ServiceOffering[] = servicesRes.status === 'fulfilled'
    ? (servicesRes.value.data.data ?? [])
    : []

  const events: EventOffering[] = eventsRes.status === 'fulfilled'
    ? (eventsRes.value.data.data ?? [])
    : []

  const regularClasses  = services.filter(s => s.isActive)
  const upcomingEvents  = events.filter(e => !e.isSoldOut || e.isBookable)
  const hasContent      = regularClasses.length > 0 || upcomingEvents.length > 0

  return (
    <main className="bg-white">

      {/* ── Page Hero ─────────────────────────────────────────────────── */}
      <section className="section-sand pt-32 pb-20 relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-yoga-200"
             style={{ top: '-100px', right: '-100px', opacity: 0.5 }} />
        <div className="container-sacred relative z-10">
          <p className="eyebrow text-yoga-600 mb-5">Sacred Experiences</p>
          <h1 className="font-heading text-display-lg md:text-display-xl text-sacred-900 leading-tight mb-5 text-balance max-w-3xl">
            Classes &amp; Schedule
          </h1>
          <span className="gold-line w-14 block mb-6" />
          <p className="text-sacred-500 text-lg font-body font-light leading-relaxed max-w-xl tracking-wide">
            Yoga classes, workshops, and sacred events for every level of practice. All are welcome.
          </p>
        </div>
      </section>

      {/* ── Regular Classes ────────────────────────────────────────────── */}
      {regularClasses.length > 0 && (
        <section className="section bg-white relative overflow-hidden">
          <div className="orb w-[400px] h-[400px] bg-yoga-100"
               style={{ bottom: '-60px', left: '-60px', opacity: 0.5 }} />
          <div className="container-sacred relative z-10">
            <div className="mb-12">
              <p className="eyebrow text-yoga-600 mb-3">Ongoing Practice</p>
              <h2 className="font-heading text-display-md text-sacred-900 leading-tight mb-2">
                Regular Classes
              </h2>
              <span className="gold-line w-12 block" />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {regularClasses.map(service => (
                <div key={service.id} className="experience-card group p-8 flex flex-col">
                  {service.featuredImageUrl && (
                    <div
                      className="h-44 rounded-2xl mb-6 bg-cover bg-center"
                      style={{ backgroundImage: `url(${service.featuredImageUrl})` }}
                    />
                  )}
                  <div className="flex-1">
                    <p className="eyebrow text-yoga-500 mb-2">
                      {service.category ?? 'Yoga'}
                    </p>
                    <h3 className="font-heading text-2xl text-sacred-900 mb-3 leading-snug">
                      {service.name}
                    </h3>
                    {service.shortDescription && (
                      <p className="text-sm text-sacred-500 font-body font-light leading-relaxed mb-5 tracking-wide">
                        {service.shortDescription}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-5 border-t border-sacred-100">
                    <div>
                      <p className="font-heading text-lg text-yoga-700">{formatPrice(service)}</p>
                      {service.durationMinutes && (
                        <p className="flex items-center gap-1.5 text-xs text-sacred-400 mt-0.5 font-body">
                          <Clock size={11} />
                          {service.durationMinutes} min
                        </p>
                      )}
                    </div>
                    {service.isBookable && (
                      <Link
                        href={`/booking?serviceId=${service.id}`}
                        className="px-5 py-2 rounded-full text-xs font-body font-medium tracking-wider uppercase bg-yoga-700 text-white hover:bg-yoga-600 shadow-sm hover:shadow-glow transition-all duration-300"
                      >
                        Book Now
                      </Link>
                    )}
                  </div>
                  <div className="shimmer-overlay rounded-3xl" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Upcoming Events ────────────────────────────────────────────── */}
      {upcomingEvents.length > 0 && (
        <section className="section section-sand relative overflow-hidden">
          <div className="orb w-[400px] h-[400px] bg-yoga-200"
               style={{ top: '-60px', right: '-60px', opacity: 0.45 }} />
          <div className="container-sacred relative z-10">
            <div className="mb-12">
              <p className="eyebrow text-yoga-600 mb-3">Sacred Gatherings</p>
              <h2 className="font-heading text-display-md text-sacred-900 leading-tight mb-2">
                Upcoming Events &amp; Workshops
              </h2>
              <span className="gold-line w-12 block" />
            </div>

            <div className="space-y-4">
              {upcomingEvents.map(event => {
                const startDate = new Date(event.startAt)
                const endDate   = new Date(event.endAt)
                return (
                  <div key={event.id} className="group bg-white border border-sacred-100 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 hover:shadow-luxury transition-all duration-500 hover:-translate-y-0.5">

                    {/* Date block */}
                    <div className="shrink-0 text-center bg-yoga-50 border border-yoga-100 rounded-2xl px-6 py-5 w-24 self-start">
                      <p className="eyebrow text-yoga-500 text-[10px] mb-1">
                        {startDate.toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p className="font-heading text-4xl text-sacred-900 leading-none">
                        {startDate.getDate()}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start gap-2 mb-2">
                        {event.category && (
                          <span className="eyebrow text-yoga-500 text-[10px]">{event.category}</span>
                        )}
                        {event.isFeatured && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-body font-semibold tracking-wider uppercase bg-yoga-100 text-yoga-700">
                            Featured
                          </span>
                        )}
                      </div>
                      <h3 className="font-heading text-2xl text-sacred-900 mb-2 leading-snug">{event.name}</h3>
                      {event.instructorName && (
                        <p className="text-sm text-sacred-400 font-body mb-3 tracking-wide">
                          with {event.instructorName}
                        </p>
                      )}
                      {event.shortDescription && (
                        <p className="text-sm text-sacred-500 font-body font-light leading-relaxed mb-4 tracking-wide">
                          {event.shortDescription}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-sacred-400 font-body">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-yoga-500" />
                          {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          {' – '}
                          {endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                        {event.venue && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-yoga-500" />
                            {event.venue}
                          </span>
                        )}
                        {event.city && (
                          <span>{event.city}{event.state ? `, ${event.state}` : ''}</span>
                        )}
                        <span className="font-heading text-yoga-700">{formatPrice(event)}</span>
                      </div>
                      {event.capacity && event.spotsRemaining !== undefined && (
                        <p className="text-xs text-sacred-400 font-body mt-2 flex items-center gap-1.5">
                          <Users size={11} className="text-yoga-500" />
                          {event.spotsRemaining} spots remaining
                        </p>
                      )}
                    </div>

                    {event.isBookable && !event.isSoldOut && (
                      <div className="shrink-0 self-center">
                        <Link
                          href={`/booking?eventId=${event.id}`}
                          className="px-6 py-3 rounded-full text-xs font-body font-medium tracking-wider uppercase bg-yoga-700 text-white hover:bg-yoga-600 shadow-sm hover:shadow-glow transition-all duration-300 whitespace-nowrap"
                        >
                          Register
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!hasContent && (
        <section className="section">
          <div className="container-sacred text-center">
            <div className="text-5xl mb-6 animate-float">✦</div>
            <p className="font-heading text-display-sm text-sacred-900 mb-3">Schedule coming soon</p>
            <p className="text-sacred-500 text-base font-body font-light mb-8 max-w-sm mx-auto leading-relaxed tracking-wide">
              We&apos;re updating our schedule. Reach out to learn about current availability.
            </p>
            <Link href="/contact" className="btn-outline-gold">
              Contact Us
            </Link>
          </div>
        </section>
      )}

      {/* ── CTA strip ───────────────────────────────────────────────────── */}
      <section data-header="dark" className="py-20 section-dark relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-yoga-700"
             style={{ top: '-100px', left: '50%', transform: 'translateX(-50%)', opacity: 0.08 }} />
        <div className="container-sacred relative z-10 text-center">
          <p className="eyebrow text-yoga-400 mb-5">Ready to Begin?</p>
          <h2 className="font-heading text-display-md text-white mb-5 text-balance">
            Your practice starts here.
          </h2>
          <p className="text-white/50 font-body font-light text-base mb-10 max-w-md mx-auto tracking-wide leading-relaxed">
            Book a private session or reach out — we&apos;ll help you find the right fit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking" className="btn-gold">Book a Session</Link>
            <Link href="/contact" className="btn-ghost-light">Get in Touch</Link>
          </div>
        </div>
      </section>

    </main>
  )
}
