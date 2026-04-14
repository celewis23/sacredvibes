import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Calendar, MapPin, Users, Globe } from 'lucide-react'
import { getCurrentBrand } from '@/lib/brand/current'
import { servicesApi } from '@/lib/api'
import { formatPrice } from '@/lib/brand/resolution'
import type { EventOffering } from '@/types'
import NewsletterSection from '@/components/sections/NewsletterSection'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Events & Retreats',
    description: 'Sacred sound baths, yoga workshops, healing retreats, and immersive experiences — in-person and virtual.',
  }
}

type FilterType = 'all' | 'in-person' | 'virtual' | 'retreat'

function classifyEvent(event: EventOffering): FilterType {
  const name = (event.name + ' ' + (event.category ?? '')).toLowerCase()
  const isOnline = !event.venue && !event.city
  if (name.includes('retreat')) return 'retreat'
  if (isOnline) return 'virtual'
  return 'in-person'
}

export default async function EventsPage() {
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)

  let events: EventOffering[] = []
  try {
    const res = await servicesApi.getEvents({ brandId: brand.id, upcomingOnly: true })
    events = res.data?.data ?? []
  } catch {
    events = []
  }

  const inPerson  = events.filter(e => classifyEvent(e) === 'in-person')
  const virtual   = events.filter(e => classifyEvent(e) === 'virtual')
  const retreats  = events.filter(e => classifyEvent(e) === 'retreat')
  const featured  = events.filter(e => e.isFeatured)

  return (
    <main className="bg-white">

      {/* ── Page Hero ─────────────────────────────────────────────────── */}
      <section className="section-sand pt-32 pb-24 relative overflow-hidden">
        <div className="orb w-[600px] h-[600px] bg-yoga-200"
             style={{ top: '-120px', right: '-100px', opacity: 0.45 }} />
        <div className="orb w-[400px] h-[400px] bg-sage-200"
             style={{ bottom: '-80px', left: '-80px', opacity: 0.3 }} />
        <div className="container-sacred relative z-10">
          <p className="eyebrow text-yoga-600 mb-5">Sacred Gatherings</p>
          <h1 className="font-heading text-display-lg md:text-display-xl text-sacred-900 leading-tight mb-5 text-balance max-w-3xl">
            Events &amp; Retreats
          </h1>
          <span className="gold-line w-14 block mb-6" />
          <p className="text-sacred-500 text-lg font-body font-light leading-relaxed max-w-xl tracking-wide mb-10">
            Immersive experiences rooted in Richmond, traveling the world. Join us in person, online, or on retreat.
          </p>
          {/* Filter pills — static display, could be enhanced with client-side filtering */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'All Events', count: events.length },
              { label: 'In-Person',  count: inPerson.length },
              { label: 'Virtual',    count: virtual.length },
              { label: 'Retreats',   count: retreats.length },
            ].map(({ label, count }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-body font-medium border border-yoga-200 text-yoga-700 bg-white/80"
              >
                {label}
                {count > 0 && (
                  <span className="w-5 h-5 rounded-full bg-yoga-100 text-yoga-700 text-[10px] font-semibold flex items-center justify-center">
                    {count}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Events ─────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="section bg-white relative overflow-hidden">
          <div className="orb w-[400px] h-[400px] bg-yoga-100"
               style={{ bottom: '-60px', left: '-60px', opacity: 0.5 }} />
          <div className="container-sacred relative z-10">
            <div className="mb-12">
              <p className="eyebrow text-yoga-600 mb-3">Not to Miss</p>
              <h2 className="font-heading text-display-md text-sacred-900 mb-2">Featured Events</h2>
              <span className="gold-line w-12 block" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {featured.map(event => (
                <EventCard key={event.id} event={event} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── In-Person ───────────────────────────────────────────────── */}
      {inPerson.length > 0 && (
        <EventSection
          title="In-Person Experiences"
          eyebrow="Richmond & Beyond"
          events={inPerson}
          bg="section-sand"
        />
      )}

      {/* ── Virtual ─────────────────────────────────────────────────── */}
      {virtual.length > 0 && (
        <EventSection
          title="Virtual Sessions"
          eyebrow="Join from Anywhere"
          events={virtual}
          bg="bg-white"
        />
      )}

      {/* ── Retreats ────────────────────────────────────────────────── */}
      {retreats.length > 0 && (
        <EventSection
          title="Retreats & Intensives"
          eyebrow="Deep Immersion"
          events={retreats}
          bg="section-sand"
        />
      )}

      {/* ── All Events fallback (when not categorized) ─────────────── */}
      {events.length > 0 && featured.length === 0 && inPerson.length === 0 && virtual.length === 0 && retreats.length === 0 && (
        <section className="section bg-white">
          <div className="container-sacred">
            <div className="mb-12">
              <p className="eyebrow text-yoga-600 mb-3">Upcoming</p>
              <h2 className="font-heading text-display-md text-sacred-900 mb-2">All Events</h2>
              <span className="gold-line w-12 block" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {events.length === 0 && (
        <section className="section">
          <div className="container-sacred text-center">
            <div className="text-5xl mb-6 animate-float">✦</div>
            <p className="font-heading text-display-sm text-sacred-900 mb-3">
              New events coming soon
            </p>
            <p className="text-sacred-500 text-base font-body font-light mb-8 max-w-sm mx-auto leading-relaxed tracking-wide">
              We&apos;re planning something sacred. Subscribe below to be the first to know.
            </p>
            <Link href="/contact" className="btn-outline-gold">
              Stay in Touch
            </Link>
          </div>
        </section>
      )}

      {/* ── Global positioning strip ────────────────────────────────── */}
      <section className="section-dark py-24 relative overflow-hidden">
        <div className="orb w-[600px] h-[600px] bg-yoga-700"
             style={{ top: '-120px', left: '50%', transform: 'translateX(-50%)', opacity: 0.08 }} />
        <div className="container-sacred relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { icon: '📍', title: 'Richmond, VA',       sub: 'Our home base & studio hub' },
              { icon: '✈️', title: 'Traveling Worldwide', sub: 'NYC · LA · Miami · International' },
              { icon: <Globe size={28} className="text-yoga-400 mx-auto" />, title: 'Global Online',  sub: 'Live virtual & on-demand' },
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10">
                <div className="text-3xl mb-4 flex justify-center">
                  {typeof item.icon === 'string' ? item.icon : item.icon}
                </div>
                <p className="font-heading text-xl text-white mb-2">{item.title}</p>
                <p className="text-sacred-400/70 text-sm font-body tracking-wide">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ──────────────────────────────────────────────── */}
      <NewsletterSection brandId={brand.id} />
    </main>
  )
}

// ── Reusable section wrapper ────────────────────────────────────────────────
function EventSection({
  title, eyebrow, events, bg,
}: {
  title: string
  eyebrow: string
  events: EventOffering[]
  bg: string
}) {
  return (
    <section className={`section ${bg} relative overflow-hidden`}>
      <div className="container-sacred relative z-10">
        <div className="mb-12">
          <p className="eyebrow text-yoga-600 mb-3">{eyebrow}</p>
          <h2 className="font-heading text-display-md text-sacred-900 mb-2">{title}</h2>
          <span className="gold-line w-12 block" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      </div>
    </section>
  )
}

// ── Event Card ──────────────────────────────────────────────────────────────
function EventCard({ event, featured = false }: { event: EventOffering; featured?: boolean }) {
  const startDate = new Date(event.startAt)
  const endDate   = new Date(event.endAt)

  return (
    <div className={`experience-card group flex flex-col p-8 ${featured ? 'ring-1 ring-yoga-400/40' : ''}`}>
      {/* Top badges */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="flex flex-wrap gap-2">
          {event.category && (
            <span className="eyebrow text-yoga-500 text-[10px]">{event.category}</span>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {event.isSoundOnTheRiver && (
            <span className="px-3 py-1 rounded-full text-[10px] font-body font-semibold tracking-wider uppercase bg-sound-100 text-sound-700">
              On the River
            </span>
          )}
          {event.isFeatured && !featured && (
            <span className="px-3 py-1 rounded-full text-[10px] font-body font-semibold tracking-wider uppercase bg-yoga-100 text-yoga-700">
              Featured
            </span>
          )}
          {event.isSoldOut && (
            <span className="px-3 py-1 rounded-full text-[10px] font-body font-semibold tracking-wider uppercase bg-red-100 text-red-600">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Title & description */}
      <h3 className="font-heading text-2xl text-sacred-900 mb-3 leading-snug">{event.name}</h3>
      {event.instructorName && (
        <p className="text-sm text-sacred-400 font-body mb-3 tracking-wide">with {event.instructorName}</p>
      )}
      {event.shortDescription && (
        <p className="text-sm text-sacred-500 font-body font-light leading-relaxed mb-5 flex-1 tracking-wide">
          {event.shortDescription}
        </p>
      )}

      {/* Meta */}
      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2 text-xs text-sacred-400 font-body">
          <Calendar size={12} className="text-yoga-500 shrink-0" />
          <span>
            {startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {' · '}
            {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            {' – '}
            {endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
        {(event.venue || event.city) && (
          <div className="flex items-center gap-2 text-xs text-sacred-400 font-body">
            <MapPin size={12} className="text-yoga-500 shrink-0" />
            <span>{[event.venue, event.city, event.state].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {event.capacity && (
          <div className="flex items-center gap-2 text-xs text-sacred-400 font-body">
            <Users size={12} className="text-yoga-500 shrink-0" />
            <span>
              {event.spotsRemaining != null
                ? `${event.spotsRemaining} spots remaining`
                : `${event.capacity} capacity`}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-5 border-t border-sacred-100">
        <p className="font-heading text-lg text-yoga-700">
          {formatPrice(event.price, event.priceType, event.currency)}
        </p>
        {event.isBookable && !event.isSoldOut ? (
          <Link
            href={`/booking?eventId=${event.id}`}
            className="px-5 py-2 rounded-full text-xs font-body font-medium tracking-wider uppercase bg-yoga-700 text-white hover:bg-yoga-600 shadow-sm hover:shadow-glow transition-all duration-300"
          >
            Register
          </Link>
        ) : event.isSoldOut ? (
          <span className="px-5 py-2 rounded-full text-xs font-body font-medium tracking-wider uppercase bg-sacred-100 text-sacred-400 cursor-not-allowed">
            Sold Out
          </span>
        ) : null}
      </div>

      <div className="shimmer-overlay rounded-3xl" />
    </div>
  )
}
