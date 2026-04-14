import Link from 'next/link'
import type { Metadata } from 'next'
import { servicesApi } from '@/lib/api'
import { getBrandConfigBySlug } from '@/lib/brand/resolution'
import type { EventOffering } from '@/types'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Sound on the River — Sacred Sound',
  description: 'An immersive outdoor sound healing experience on the water. Join us for our signature event combining crystal bowls, gongs, and the natural soundscape of the river.',
}

export default async function SoundOnTheRiverPage() {
  const brand = getBrandConfigBySlug('sacred-sound')

  let events: EventOffering[] = []
  try {
    const res = await servicesApi.getEvents({
      brandId: brand.id,
      soundOnTheRiver: true,
      upcomingOnly: true,
    })
    events = res.data.data ?? []
  } catch { /* show page without events */ }

  return (
    <main>
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/sound-on-river.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-sound-950/85 via-sound-800/70 to-indigo-900/85" />
        {/* Decorative rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="absolute rounded-full border border-white/5"
              style={{
                width: `${i * 20}vw`,
                height: `${i * 20}vw`,
                animationDuration: `${8 + i * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-sound-300 mb-6">
            Sacred Sound Presents
          </p>
          <h1 className="font-heading text-5xl md:text-7xl text-white mb-6 leading-tight">
            Sound on the River
          </h1>
          <p className="text-xl text-sound-200 leading-relaxed mb-10">
            An immersive outdoor sound healing experience where the music of crystal bowls,
            Tibetan singing bowls, gongs, and the river itself become one.
          </p>
          <Link
            href={events.length > 0 ? `#upcoming-events` : '/contact'}
            className="inline-block px-10 py-4 bg-white text-sound-900 rounded-full font-medium text-lg hover:bg-sound-50 transition-colors"
          >
            {events.length > 0 ? 'See Upcoming Dates' : 'Join the Waitlist'}
          </Link>
        </div>
      </section>

      {/* What it is */}
      <section className="section bg-sound-950 text-white">
        <div className="container-sacred max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-sound-400 mb-4">The Experience</p>
              <h2 className="font-heading text-3xl md:text-4xl mb-5">Where Water Meets Vibration</h2>
              <p className="text-sound-300 leading-relaxed mb-4">
                Sound on the River is our signature outdoor event — a deeply immersive sound journey
                held at the water&apos;s edge at sunrise or twilight. The natural acoustic environment
                of the river amplifies and complements every tone, creating an experience unlike
                anything found in a studio.
              </p>
              <p className="text-sound-300 leading-relaxed">
                Participants lie on comfortable mats surrounded by the instruments and the natural
                soundscape. There is nothing to do — only receive.
              </p>
            </div>
            <div className="space-y-5">
              {[
                { label: 'Duration', value: '90 minutes' },
                { label: 'Setting', value: 'Outdoor riverbank, weather permitting' },
                { label: 'Capacity', value: 'Limited to 20 participants per session' },
                { label: 'What to bring', value: 'Yoga mat, blanket, layers for temperature changes' },
                { label: 'Experience required', value: 'None — open to all' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-4 text-sm">
                  <span className="text-sound-500 w-32 shrink-0">{item.label}</span>
                  <span className="text-sound-200">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming dates */}
      <section id="upcoming-events" className="section bg-white">
        <div className="container-sacred max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl text-sound-900 mb-8 text-center">Upcoming Dates</h2>

          {events.length === 0 ? (
            <div className="text-center bg-sound-50 rounded-2xl p-12">
              <p className="font-heading text-xl text-sound-800 mb-3">Next dates coming soon</p>
              <p className="text-sound-600 text-sm mb-6">
                Join our list to be the first to know when new dates are announced.
                Sound on the River sells out quickly.
              </p>
              <Link
                href="/contact"
                className="inline-block px-8 py-3 bg-sound-800 text-white rounded-full text-sm hover:bg-sound-900 transition-colors"
              >
                Join the Waitlist
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {events.map(event => (
                <div
                  key={event.id}
                  className="bg-sound-50 border border-sound-100 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5"
                >
                  <div className="shrink-0 text-center bg-white rounded-xl px-6 py-4 border border-sound-100">
                    <p className="text-xs font-medium text-sound-400 uppercase">
                      {new Date(event.startAt).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="font-heading text-3xl text-sound-900 leading-none">
                      {new Date(event.startAt).getDate()}
                    </p>
                    <p className="text-xs text-sound-500 mt-0.5">
                      {new Date(event.startAt).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-heading text-xl text-sound-900 mb-1">{event.name}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-sound-600">
                      <span>
                        {new Date(event.startAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        {' – '}
                        {new Date(event.endAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      {event.venue && <span>{event.venue}</span>}
                      {event.city && <span>{event.city}{event.state ? `, ${event.state}` : ''}</span>}
                      {event.price ? (
                        <span className="font-medium text-sound-800">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: event.currency }).format(event.price)}
                        </span>
                      ) : null}
                    </div>
                    {event.spotsRemaining !== undefined && (
                      <p className="text-xs text-sound-400 mt-1">{event.spotsRemaining} spots remaining</p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {event.isSoldOut ? (
                      <span className="px-5 py-2.5 bg-gray-100 text-gray-500 text-sm rounded-full cursor-not-allowed">
                        Sold Out
                      </span>
                    ) : event.isBookable ? (
                      <Link
                        href={`/booking?eventId=${event.id}`}
                        className="inline-block px-5 py-2.5 bg-sound-800 text-white text-sm rounded-full hover:bg-sound-900 transition-colors"
                      >
                        Reserve Your Spot
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonial / closer */}
      <section className="section bg-sound-950 text-center">
        <div className="container-sacred max-w-2xl mx-auto">
          <p className="font-heading text-2xl md:text-3xl text-white italic leading-relaxed mb-6">
            &ldquo;I came in carrying the week in my shoulders. I left feeling like I had been rinsed clean by the river itself.&rdquo;
          </p>
          <p className="text-sound-400 text-sm">— Sarah M., Sound on the River attendee</p>
          <div className="mt-10">
            <Link
              href="/contact"
              className="inline-block px-8 py-3 border border-white/30 text-white rounded-full text-sm hover:bg-white/10 transition-colors"
            >
              Questions? Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
