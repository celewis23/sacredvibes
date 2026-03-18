import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCurrentBrand } from '@/lib/brand/current'
import { servicesApi } from '@/lib/api'
import type { ServiceOffering, EventOffering } from '@/types'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Classes & Schedule — Sacred Vibes Yoga',
    description: 'Browse yoga classes, workshops, and events. All levels welcome.',
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

  const regularClasses = services.filter(s => s.isActive)
  const upcomingEvents = events.filter(e => !e.isSoldOut || e.isBookable)

  return (
    <main>
      {/* Hero */}
      <section className="section-sm bg-sacred-50">
        <div className="container-sacred">
          <h1 className="font-heading text-4xl md:text-5xl text-sacred-900 mb-3">Classes &amp; Schedule</h1>
          <p className="text-lg text-sacred-600 max-w-2xl">
            Regular classes, workshops, and special events for every level of practice.
          </p>
        </div>
      </section>

      {/* Regular classes */}
      {regularClasses.length > 0 && (
        <section className="section">
          <div className="container-sacred">
            <h2 className="font-heading text-2xl text-sacred-900 mb-8">Regular Classes</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {regularClasses.map(service => (
                <div key={service.id} className="bg-white border border-sacred-100 rounded-2xl p-6 hover:shadow-card transition-shadow">
                  {service.featuredImageUrl && (
                    <div
                      className="h-40 rounded-xl mb-4 bg-cover bg-center"
                      style={{ backgroundImage: `url(${service.featuredImageUrl})` }}
                    />
                  )}
                  <p className="text-xs font-medium uppercase tracking-widest text-sacred-400 mb-1">
                    {service.category ?? 'Yoga'}
                  </p>
                  <h3 className="font-heading text-xl text-sacred-900 mb-2">{service.name}</h3>
                  {service.shortDescription && (
                    <p className="text-sm text-sacred-600 leading-relaxed mb-4">{service.shortDescription}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-sacred-700 font-medium">{formatPrice(service)}</span>
                    {service.durationMinutes && (
                      <span className="text-sacred-400">{service.durationMinutes} min</span>
                    )}
                  </div>
                  {service.isBookable && (
                    <Link
                      href={`/booking?serviceId=${service.id}`}
                      className="mt-4 block text-center px-5 py-2 bg-sacred-800 text-white text-sm rounded-full hover:bg-sacred-900 transition-colors"
                    >
                      Book Now
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <section className="section bg-sacred-50">
          <div className="container-sacred">
            <h2 className="font-heading text-2xl text-sacred-900 mb-8">Upcoming Events &amp; Workshops</h2>
            <div className="space-y-4">
              {upcomingEvents.map(event => (
                <div key={event.id} className="bg-white border border-sacred-100 rounded-2xl p-6 flex flex-col sm:flex-row gap-5 hover:shadow-card transition-shadow">
                  {/* Date block */}
                  <div className="shrink-0 text-center bg-sacred-50 rounded-xl px-5 py-4 w-20 self-start">
                    <p className="text-xs font-medium uppercase tracking-wide text-sacred-400">
                      {new Date(event.startAt).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="font-heading text-3xl text-sacred-900 leading-none">
                      {new Date(event.startAt).getDate()}
                    </p>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-start gap-2 mb-1">
                      <h3 className="font-heading text-xl text-sacred-900">{event.name}</h3>
                      {event.isFeatured && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Featured</span>
                      )}
                    </div>
                    {event.instructorName && (
                      <p className="text-sm text-sacred-500 mb-2">with {event.instructorName}</p>
                    )}
                    {event.shortDescription && (
                      <p className="text-sm text-sacred-600 leading-relaxed mb-3">{event.shortDescription}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-sacred-500">
                      <span>
                        {new Date(event.startAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {' – '}
                        {new Date(event.endAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      {event.venue && <span>{event.venue}</span>}
                      {event.city && <span>{event.city}{event.state ? `, ${event.state}` : ''}</span>}
                      <span className="font-medium text-sacred-700">{formatPrice(event)}</span>
                    </div>
                    {event.capacity && (
                      <p className="text-xs text-sacred-400 mt-1">
                        {event.spotsRemaining !== undefined
                          ? `${event.spotsRemaining} spots remaining`
                          : `${event.registeredCount} registered`}
                      </p>
                    )}
                  </div>

                  {event.isBookable && !event.isSoldOut && (
                    <div className="shrink-0 self-center">
                      <Link
                        href={`/booking?eventId=${event.id}`}
                        className="px-5 py-2.5 bg-sacred-800 text-white text-sm rounded-full hover:bg-sacred-900 transition-colors whitespace-nowrap"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {regularClasses.length === 0 && upcomingEvents.length === 0 && (
        <section className="section">
          <div className="container-sacred text-center text-sacred-400">
            <p className="font-heading text-2xl mb-2">Schedule coming soon</p>
            <p className="text-sm mb-6">
              We&apos;re updating our schedule. Get in touch for current availability.
            </p>
            <Link
              href="/contact"
              className="px-6 py-2.5 bg-sacred-800 text-white rounded-full text-sm hover:bg-sacred-900 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}
