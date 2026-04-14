import Link from 'next/link'
import type { BrandContext } from '@/lib/brand/resolution'
import HeroSection from '@/components/sections/HeroSection'
import ExperienceSelector from '@/components/site/ExperienceSelector'
import NewsletterSection from '@/components/sections/NewsletterSection'
import { getBrandIdBySlug } from '@/lib/brand/resolution'
import { servicesApi, blogApi } from '@/lib/api'
import type { ServiceOffering, EventOffering } from '@/types'
import { Clock, Calendar, MapPin, Users, ArrowRight } from 'lucide-react'
import { formatPrice } from '@/lib/brand/resolution'
import { format } from 'date-fns'

interface Props { brand: BrandContext }

async function getData() {
  try {
    const brandId = getBrandIdBySlug('sacred-vibes-yoga')
    const [servicesRes, eventsRes, postsRes] = await Promise.allSettled([
      servicesApi.getServices({ brandId }),
      servicesApi.getEvents({ brandId, upcomingOnly: true }),
      blogApi.getPosts({ brandSlug: 'sacred-vibes-yoga', pageSize: 3 }),
    ])
    return {
      services: servicesRes.status === 'fulfilled' ? servicesRes.value.data?.data ?? [] : [],
      events:   eventsRes.status === 'fulfilled'   ? eventsRes.value.data?.data ?? []   : [],
      posts:    postsRes.status === 'fulfilled'    ? postsRes.value.data?.data?.items ?? [] : [],
    }
  } catch {
    return { services: [], events: [], posts: [] }
  }
}

// ── Static fallback offerings when no API data ──────────────────────────────
const STATIC_OFFERINGS = [
  {
    icon: '🎵',
    category: 'Signature',
    name: 'Floating Sound Bath',
    description: 'Our signature immersive experience — lay back and let crystal singing bowls, gongs, and sacred instruments carry you into deep restoration.',
    duration: '90 min',
    price: 'From $55',
    href: '/booking',
    featured: true,
  },
  {
    icon: '🧘',
    category: 'Yoga',
    name: 'Yoga + Sound Bath',
    description: 'A full-spectrum session blending intentional movement with the healing power of sound. Leave feeling completely renewed.',
    duration: '75 min',
    price: 'From $40',
    href: '/classes',
    featured: false,
  },
  {
    icon: '✦',
    category: 'Private',
    name: 'Private Sound Healing',
    description: 'One-on-one vibrational therapy custom-designed for your specific needs, intentions, and healing journey.',
    duration: '60 min',
    price: 'From $120',
    href: '/booking',
    featured: false,
  },
  {
    icon: '🌿',
    category: 'Wellness',
    name: 'Corporate Wellness',
    description: 'Bring sacred wellness to your team. Custom sound healing, breathwork, and yoga programs for organizations of all sizes.',
    duration: 'Custom',
    price: 'Inquire',
    href: '/contact',
    featured: false,
  },
  {
    icon: '💆',
    category: 'Bodywork',
    name: 'Massage + Sound Therapy',
    description: 'The ultimate healing fusion — therapeutic massage infused with live sound healing vibrations that permeate every cell.',
    duration: '90 min',
    price: 'From $150',
    href: 'https://hands.sacredvibesyoga.com',
    featured: false,
  },
  {
    icon: '🌊',
    category: 'Outdoor',
    name: 'Sound on the River',
    description: 'Our beloved outdoor ceremonial experience. Imagine: crystal bowls by the water at golden hour. Pure magic.',
    duration: '2 hrs',
    price: 'From $65',
    href: 'https://sound.sacredvibesyoga.com/sound-on-the-river',
    featured: false,
  },
]

const TESTIMONIALS = [
  {
    quote: "I walked in carrying three years of grief and walked out feeling held by something much larger than myself. Shanna's presence is medicine.",
    name: 'Amara T.',
    location: 'Richmond, VA',
  },
  {
    quote: "The floating sound bath changed my entire relationship with my body. I felt frequencies I didn't know existed. Absolutely transformational.",
    name: 'Jordan M.',
    location: 'Washington, DC',
  },
  {
    quote: "This isn't just a yoga class — it's a complete frequency reset. I leave every single session feeling like a completely different person.",
    name: 'Keisha W.',
    location: 'Atlanta, GA',
  },
]

// ── Upgraded Service Card ────────────────────────────────────────────────────
function PremiumServiceCard({ service }: { service: ServiceOffering }) {
  return (
    <div className="experience-card group p-8 flex flex-col">
      <div className="flex-1">
        {service.category && (
          <p className="eyebrow text-yoga-600 mb-3">{service.category}</p>
        )}
        <h3 className="font-heading text-2xl text-sacred-900 mb-3 leading-snug">
          {service.name}
        </h3>
        {service.shortDescription && (
          <p className="text-sm text-sacred-500 leading-relaxed mb-5 font-body">
            {service.shortDescription}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between pt-5 border-t border-sacred-100">
        <div>
          <p className="font-heading text-lg text-yoga-700">
            {formatPrice(service.price, service.priceType, service.currency)}
          </p>
          {service.durationMinutes && (
            <p className="flex items-center gap-1.5 text-xs text-sacred-400 mt-0.5 font-body">
              <Clock size={11} />
              {service.durationMinutes} min
            </p>
          )}
        </div>
        {service.isBookable && (
          <Link
            href={`/booking?service=${service.id}`}
            className="px-5 py-2 rounded-full text-xs font-body font-medium tracking-wider uppercase bg-yoga-700 text-white hover:bg-yoga-600 shadow-sm hover:shadow-glow transition-all duration-300"
          >
            Book
          </Link>
        )}
      </div>
      <div className="shimmer-overlay rounded-3xl" />
    </div>
  )
}

// ── Static Offering Card ─────────────────────────────────────────────────────
function OfferingCard({ item }: { item: typeof STATIC_OFFERINGS[0] }) {
  return (
    <div className={`experience-card group p-8 flex flex-col ${item.featured ? 'ring-1 ring-yoga-400/40' : ''}`}>
      {item.featured && (
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 rounded-full text-[10px] font-body font-semibold tracking-widest uppercase bg-yoga-100 text-yoga-700">
            Signature
          </span>
        </div>
      )}
      <div className="text-3xl mb-5">{item.icon}</div>
      <div className="flex-1">
        <p className="eyebrow text-yoga-500 mb-2">{item.category}</p>
        <h3 className="font-heading text-2xl text-sacred-900 mb-3 leading-snug">{item.name}</h3>
        <p className="text-sm text-sacred-500 leading-relaxed mb-5 font-body">{item.description}</p>
      </div>
      <div className="flex items-center justify-between pt-5 border-t border-sacred-100">
        <div>
          <p className="font-heading text-lg text-yoga-700">{item.price}</p>
          <p className="flex items-center gap-1.5 text-xs text-sacred-400 mt-0.5 font-body">
            <Clock size={11} />
            {item.duration}
          </p>
        </div>
        <Link
          href={item.href}
          className="px-5 py-2 rounded-full text-xs font-body font-medium tracking-wider uppercase bg-yoga-700 text-white hover:bg-yoga-600 shadow-sm hover:shadow-glow transition-all duration-300"
        >
          Book
        </Link>
      </div>
      <div className="shimmer-overlay rounded-3xl" />
    </div>
  )
}

// ── Upgraded Event Card ──────────────────────────────────────────────────────
function PremiumEventCard({ event }: { event: EventOffering }) {
  const startDate = new Date(event.startAt)
  return (
    <div className="experience-card group p-8 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          {event.category && (
            <p className="eyebrow text-yoga-500 mb-2">{event.category}</p>
          )}
          {event.isSoldOut && (
            <span className="px-3 py-1 rounded-full text-[10px] font-body font-semibold tracking-widest uppercase bg-red-100 text-red-600">
              Sold Out
            </span>
          )}
        </div>
        {event.isSoundOnTheRiver && (
          <span className="px-3 py-1 rounded-full text-[10px] font-body font-semibold tracking-widest uppercase bg-sound-100 text-sound-700">
            On the River
          </span>
        )}
      </div>
      <h3 className="font-heading text-2xl text-sacred-900 mb-3 leading-snug">{event.name}</h3>
      {event.shortDescription && (
        <p className="text-sm text-sacred-500 leading-relaxed mb-5 flex-1 font-body">{event.shortDescription}</p>
      )}
      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2 text-xs text-sacred-400 font-body">
          <Calendar size={12} className="shrink-0 text-yoga-500" />
          <span>{format(startDate, 'EEEE, MMMM d')} · {format(startDate, 'h:mm a')}</span>
        </div>
        {(event.venue || event.city) && (
          <div className="flex items-center gap-2 text-xs text-sacred-400 font-body">
            <MapPin size={12} className="shrink-0 text-yoga-500" />
            <span>{[event.venue, event.city, event.state].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {event.capacity && (
          <div className="flex items-center gap-2 text-xs text-sacred-400 font-body">
            <Users size={12} className="shrink-0 text-yoga-500" />
            <span>
              {event.spotsRemaining != null
                ? `${event.spotsRemaining} spots remaining`
                : `${event.capacity} capacity`}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-5 border-t border-sacred-100">
        <p className="font-heading text-lg text-yoga-700">
          {formatPrice(event.price, event.priceType, event.currency)}
        </p>
        {event.isBookable && !event.isSoldOut && (
          <Link
            href={`/events/${event.slug}?register=1`}
            className="px-5 py-2 rounded-full text-xs font-body font-medium tracking-wider uppercase bg-yoga-700 text-white hover:bg-yoga-600 shadow-sm hover:shadow-glow transition-all duration-300"
          >
            Register
          </Link>
        )}
      </div>
      <div className="shimmer-overlay rounded-3xl" />
    </div>
  )
}

// ── SectionLink helper ───────────────────────────────────────────────────────
function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="text-center mt-12">
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-sm font-body font-medium text-yoga-700 hover:text-yoga-900 tracking-wide group transition-colors"
      >
        {label}
        <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
      </Link>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default async function YogaHomePage({ brand }: Props) {
  const { services, events, posts } = await getData()

  return (
    <>
      {/* ══════════════════════════════════════════════
          1. HERO — Cinematic entry portal
      ══════════════════════════════════════════════ */}
      <HeroSection
        eyebrow="Sacred Vibes Healing & Wellness"
        heading="Align. Restore. Elevate."
        subheading="Merging ancient sacred wellness practices with modern life — to help you regulate, reconnect, and elevate your frequency."
        primaryCta={{ label: 'Begin Your Journey', href: '/booking' }}
        secondaryCta={{ label: 'Book a Session',   href: '/classes' }}
        colorScheme="yoga"
        variant="centered"
      />

      {/* ══════════════════════════════════════════════
          2. EXPERIENCE SELECTOR — Interactive entry
      ══════════════════════════════════════════════ */}
      <ExperienceSelector />

      {/* ══════════════════════════════════════════════
          3. SACRED OFFERINGS — Immersive service cards
      ══════════════════════════════════════════════ */}
      <section className="section section-sand relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-yoga-200"
             style={{ top: '-100px', right: '-100px', opacity: 0.5 }} />
        <div className="container-sacred relative z-10">
          <div className="text-center mb-16">
            <p className="eyebrow text-yoga-600 mb-4">Sacred Experiences</p>
            <h2 className="font-heading text-display-md md:text-display-lg text-sacred-900 leading-tight mb-5 text-balance">
              Offerings Designed<br className="hidden md:block" /> to Transform
            </h2>
            <span className="gold-line w-16 block mx-auto mb-5" />
            <p className="text-sacred-500 text-base font-body font-light max-w-xl mx-auto leading-relaxed tracking-wide">
              Every experience is crafted to meet you exactly where you are and guide you toward where you want to be.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.length > 0
              ? services.slice(0, 6).map((s) => <PremiumServiceCard key={s.id} service={s} />)
              : STATIC_OFFERINGS.map((o) => <OfferingCard key={o.name} item={o} />)
            }
          </div>

          <SectionLink href="/classes" label="View all experiences" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          4. EVENTS & RETREATS — Curated experiences
      ══════════════════════════════════════════════ */}
      {events.length > 0 && (
        <section className="section bg-white relative overflow-hidden">
          <div className="orb w-[400px] h-[400px] bg-yoga-100"
               style={{ bottom: '-80px', left: '-60px', opacity: 0.6 }} />
          <div className="container-sacred relative z-10">
            <div className="text-center mb-16">
              <p className="eyebrow text-yoga-600 mb-4">Sacred Gatherings</p>
              <h2 className="font-heading text-display-md md:text-display-lg text-sacred-900 leading-tight mb-5 text-balance">
                Events & Retreats
              </h2>
              <span className="gold-line w-16 block mx-auto mb-5" />
              <p className="text-sacred-500 text-base font-body font-light max-w-xl mx-auto leading-relaxed tracking-wide">
                In-person, virtual, and traveling experiences — Richmond and beyond.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.slice(0, 3).map((e) => <PremiumEventCard key={e.id} event={e} />)}
            </div>
            <SectionLink href="/events" label="See all upcoming events" />
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          5. DIGITAL STUDIO — Global expansion
      ══════════════════════════════════════════════ */}
      <section className="section section-dark relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-sage-700"
             style={{ top: '-60px', left: '10%', opacity: 0.07 }} />
        <div className="orb w-[400px] h-[400px] bg-yoga-600"
             style={{ bottom: '-80px', right: '5%', opacity: 0.08 }} />

        <div className="container-sacred relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left: content */}
              <div>
                <p className="eyebrow text-yoga-400 mb-5">Digital Studio</p>
                <h2 className="font-heading text-display-md md:text-display-lg text-white leading-tight mb-6 text-balance">
                  Heal from<br/>Anywhere in the World
                </h2>
                <span className="gold-line w-14 block mb-8" />
                <p className="text-white/55 text-base font-body font-light leading-relaxed mb-8 tracking-wide">
                  The Sacred Vibes Digital Studio brings the full healing experience directly to you. On-demand yoga flows, guided sound meditations, breathwork sessions, and live virtual ceremonies — available whenever your soul calls for it.
                </p>
                <div className="space-y-4 mb-10">
                  {[
                    'On-demand yoga flows & sound healing sessions',
                    'Guided breathwork & meditation library',
                    'Live virtual ceremonies & workshops',
                    'Monthly membership & digital wellness plans',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="text-yoga-400 mt-0.5 flex-shrink-0">✦</span>
                      <p className="text-white/60 text-sm font-body tracking-wide">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/digital-studio" className="btn-gold">
                    Enter the Studio
                  </Link>
                  <Link href="/contact" className="btn-ghost-dark">
                    Join Waitlist
                  </Link>
                </div>
              </div>

              {/* Right: preview cards */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '🎵', label: 'Sound Healing',  count: '12+ sessions' },
                  { icon: '🧘', label: 'Yoga Flows',     count: '24+ classes'  },
                  { icon: '🌬️', label: 'Breathwork',     count: '8+ practices' },
                  { icon: '🔮', label: 'Meditations',    count: '16+ tracks'   },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-yoga-500/30 transition-all duration-400 group cursor-pointer"
                  >
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </div>
                    <p className="font-heading text-lg text-white mb-1">{item.label}</p>
                    <p className="text-xs text-yoga-400/70 font-body tracking-wide">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          6. ABOUT SHANNA — Powerful personal brand
      ══════════════════════════════════════════════ */}
      <section className="section section-sand relative overflow-hidden">
        <div className="orb w-[600px] h-[600px] bg-yoga-200"
             style={{ top: '-100px', left: '-150px', opacity: 0.4 }} />
        <div className="container-sacred relative z-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Portrait placeholder — replace with actual photo */}
            <div className="relative order-2 lg:order-1">
              <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-yoga-100 via-yoga-200 to-yoga-300 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4 animate-float">✦</div>
                    <p className="text-yoga-600/60 text-sm font-body tracking-widest uppercase">
                      Shanna Latia
                    </p>
                  </div>
                </div>
                {/* Overlay gradient for polish */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-yoga-200/60 to-transparent" />
              </div>
              {/* Floating credential badge */}
              <div className="absolute -bottom-6 -right-6 p-5 rounded-3xl bg-white shadow-luxury border border-sacred-100">
                <p className="font-heading text-2xl text-yoga-700 text-center leading-none">10+</p>
                <p className="text-xs text-sacred-500 font-body tracking-wide text-center mt-1">Years of<br/>Practice</p>
              </div>
            </div>

            {/* Story */}
            <div className="order-1 lg:order-2">
              <p className="eyebrow text-yoga-600 mb-5">The Guide</p>
              <h2 className="font-heading text-display-md md:text-display-lg text-sacred-900 leading-tight mb-6 text-balance">
                Meet Shanna Latia
              </h2>
              <span className="gold-line w-14 block mb-8" />
              <div className="space-y-5 text-sacred-600 font-body font-light leading-relaxed tracking-wide text-base">
                <p>
                  Shanna Latia is a yoga teacher, sound healer, and energy practitioner whose life's work sits at the intersection of ancient wisdom and modern healing. She founded Sacred Vibes Healing & Wellness as a living, breathing sanctuary — a space where transformation is not just possible, it's inevitable.
                </p>
                <p>
                  Through years of dedicated practice, study, and deep listening, Shanna has developed a signature approach that honors the body as sacred, the mind as powerful, and the spirit as the ultimate guide. Her sessions are not performances — they are portals.
                </p>
                <p>
                  Whether she's leading a sound bath for one or a ceremony for hundreds, her presence creates the conditions for profound healing. Clients describe her gift simply: <em className="text-sacred-800 not-italic font-normal">"I felt completely held."</em>
                </p>
              </div>
              <div className="flex flex-wrap gap-3 my-8">
                {['Yoga Teacher (RYT-500)', 'Certified Sound Healer', 'Energy Practitioner', 'Corporate Wellness Expert'].map((cert) => (
                  <span
                    key={cert}
                    className="px-4 py-2 rounded-full text-xs font-body font-medium tracking-wide bg-yoga-100 text-yoga-800 border border-yoga-200"
                  >
                    {cert}
                  </span>
                ))}
              </div>
              <Link href="/about" className="btn-outline-gold">
                Read Full Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          7. TESTIMONIALS — Transformation stories
      ══════════════════════════════════════════════ */}
      <section className="section bg-white relative overflow-hidden">
        <div className="orb w-[400px] h-[400px] bg-yoga-100"
             style={{ top: '-60px', right: '-60px', opacity: 0.5 }} />
        <div className="container-sacred relative z-10">
          <div className="text-center mb-16">
            <p className="eyebrow text-yoga-600 mb-4">Sacred Testimonies</p>
            <h2 className="font-heading text-display-md md:text-display-lg text-sacred-900 leading-tight mb-5 text-balance">
              Real Transformations
            </h2>
            <span className="gold-line w-16 block mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card group">
                {/* Quote mark */}
                <div className="font-heading text-6xl text-yoga-200 leading-none mb-4 group-hover:text-yoga-300 transition-colors duration-300">
                  &ldquo;
                </div>
                <p className="text-sacred-700 font-body font-light text-base leading-relaxed mb-6 tracking-wide italic">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3 pt-5 border-t border-sacred-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yoga-300 to-yoga-500 flex items-center justify-center text-white font-heading font-semibold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-body font-medium text-sacred-900 text-sm">{t.name}</p>
                    <p className="text-sacred-400 text-xs font-body tracking-wide">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          8. NEWSLETTER — Sacred gift + email capture
      ══════════════════════════════════════════════ */}
      <NewsletterSection brandId={getBrandIdBySlug('sacred-vibes-yoga')} colorScheme="yoga" />

      {/* ══════════════════════════════════════════════
          9. FINAL CTA — Begin your journey
      ══════════════════════════════════════════════ */}
      <section className="relative py-32 overflow-hidden section-dark">
        <div className="orb w-[600px] h-[600px] bg-yoga-700"
             style={{ top: '-120px', left: '50%', transform: 'translateX(-50%)', opacity: 0.1 }} />

        <div className="container-sacred relative z-10 text-center">
          <div className="sacred-divider mb-12">
            <span className="text-yoga-500/60 text-xl">✦</span>
          </div>
          <p className="eyebrow text-yoga-400 mb-6">Your Healing Awaits</p>
          <h2 className="font-heading text-display-lg md:text-display-xl text-white leading-tight mb-6 text-balance max-w-3xl mx-auto">
            Begin Your Healing Journey
          </h2>
          <p className="text-white/50 text-base font-body font-light max-w-lg mx-auto leading-relaxed tracking-wide mb-12">
            There is no perfect moment. There is only now — and the courage to show up for yourself.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link href="/booking"          className="btn-gold">Book a Session</Link>
            <Link href="/classes"          className="btn-ghost-light">Join a Class</Link>
            <Link href="/digital-studio"   className="btn-ghost-dark">Enter Digital Studio</Link>
          </div>
          <div className="sacred-divider mt-14">
            <span className="text-yoga-500/40 text-xl">✦</span>
          </div>
        </div>
      </section>
    </>
  )
}
