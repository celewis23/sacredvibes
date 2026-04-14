import Link from 'next/link'
import type { Metadata } from 'next'
import { Play, Lock } from 'lucide-react'
import NewsletterSection from '@/components/sections/NewsletterSection'
import { getBrandIdBySlug } from '@/lib/brand/resolution'
import LotusMark from '@/components/branding/LotusMark'

export const metadata: Metadata = {
  title: 'Digital Studio',
  description: 'On-demand yoga flows, guided sound healing, breathwork, and meditations — heal from anywhere in the world with Sacred Vibes.',
}

const CATEGORIES = [
  {
    icon: '🎵',
    title: 'Sound Healing',
    description: 'Crystal bowls, gongs, and sacred instruments delivered directly to your nervous system. Sessions range from 10-minute resets to full 60-minute journeys.',
    count: 12,
    tags: ['Crystal Bowls', 'Gong Bath', 'Binaural Beats', 'Sleep Support'],
    preview: true,
  },
  {
    icon: '🧘',
    title: 'Yoga Flows',
    description: 'Vinyasa, yin, restorative, and alignment-focused classes with Shanna. All levels. All bodies. Every practice is an act of sacred self-care.',
    count: 24,
    tags: ['Vinyasa', 'Yin', 'Restorative', 'Morning Flow', 'Power'],
    preview: true,
  },
  {
    icon: '🌬️',
    title: 'Breathwork',
    description: 'Conscious connected breath, box breathing, pranayama, and ceremonial breathwork practices to regulate, energize, or deeply release.',
    count: 8,
    tags: ['Pranayama', 'Box Breathing', 'Release Work', 'Energizing'],
    preview: false,
  },
  {
    icon: '🔮',
    title: 'Guided Meditation',
    description: 'Body scans, visualizations, chakra journeys, and frequency meditations designed to quiet the mind and open the heart.',
    count: 16,
    tags: ['Body Scan', 'Visualization', 'Chakra Work', 'Sleep'],
    preview: false,
  },
  {
    icon: '🌙',
    title: 'Ceremonies & Rituals',
    description: 'Full moon ceremonies, new moon intentions, seasonal rituals, and sacred ceremonial recordings from live events around the world.',
    count: 6,
    tags: ['Full Moon', 'New Moon', 'Seasonal', 'Live Recordings'],
    preview: false,
  },
  {
    icon: '💫',
    title: 'Energy Work',
    description: 'Reiki attunements, chakra balancing, aura clearing, and guided energy practices to restore flow and alignment to your subtle body.',
    count: 10,
    tags: ['Reiki', 'Chakra Balancing', 'Aura Clearing', 'Protection'],
    preview: false,
  },
]

const PLANS = [
  {
    name: 'Explorer',
    price: 'Free',
    period: '',
    description: 'Dip your toes into the sacred waters.',
    features: [
      '2 free sound healing sessions',
      '3 introductory yoga classes',
      'Weekly sacred text newsletter',
      'Community access',
    ],
    cta: 'Start Free',
    href: '#waitlist',
    highlighted: false,
  },
  {
    name: 'Seeker',
    price: '$33',
    period: '/ month',
    description: 'A consistent practice for your healing journey.',
    features: [
      'Full sound healing library (12+ sessions)',
      'All yoga flows (24+ classes)',
      'New content monthly',
      'Live virtual ceremonies (monthly)',
      'Member discounts on in-person events',
      'Community circle access',
    ],
    cta: 'Join Waitlist',
    href: '#waitlist',
    highlighted: true,
  },
  {
    name: 'Devotee',
    price: '$88',
    period: '/ month',
    description: 'Full immersion. Complete access. Deep transformation.',
    features: [
      'Everything in Seeker',
      'Full breathwork & meditation library',
      'Ceremonies & energy work library',
      '1 private virtual session / month with Shanna',
      'Early access to retreats & events',
      'Founding member pricing (locked forever)',
    ],
    cta: 'Join Waitlist',
    href: '#waitlist',
    highlighted: false,
  },
]

const SAMPLE_TRACKS = [
  { title: 'Morning Frequency Reset',       duration: '12 min', type: 'Sound Healing', locked: false },
  { title: 'Root Chakra Grounding Flow',    duration: '45 min', type: 'Yoga',          locked: false },
  { title: 'Deep Release Sound Journey',    duration: '60 min', type: 'Sound Healing', locked: true  },
  { title: 'Lunar Breathwork Ceremony',     duration: '30 min', type: 'Breathwork',    locked: true  },
  { title: 'Slow Flow & Sound Integration', duration: '55 min', type: 'Yoga',          locked: true  },
  { title: 'Sleep & Restoration Bath',      duration: '40 min', type: 'Sound Healing', locked: true  },
]

export default function DigitalStudioPage() {
  const brandId = getBrandIdBySlug('sacred-vibes-yoga')

  return (
    <main className="bg-white">

      {/* ── Page Hero ───────────────────────────────────────────────── */}
      <section data-header="dark" className="section-dark pt-32 pb-28 relative overflow-hidden">
        <div className="orb w-[700px] h-[700px] bg-yoga-700"
             style={{ top: '-150px', right: '-150px', opacity: 0.1 }} />
        <div className="orb w-[500px] h-[500px] bg-sage-700"
             style={{ bottom: '-100px', left: '-100px', opacity: 0.07 }} />

        <div className="container-sacred relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-yoga-700/30 border border-yoga-500/30 flex items-center justify-center text-3xl mx-auto mb-8 animate-float">
              <LotusMark className="w-10" />
            </div>
            <p className="eyebrow text-yoga-400 mb-5">Sacred Vibes Digital Studio</p>
            <h1 className="font-heading text-display-lg md:text-display-xl text-white leading-tight mb-5 text-balance">
              Heal from Anywhere<br/>in the World
            </h1>
            <span className="gold-line w-16 block mx-auto mb-8" />
            <p className="text-white/60 text-lg font-body font-light leading-relaxed tracking-wide mb-12 max-w-2xl mx-auto">
              The full Sacred Vibes experience — on-demand yoga, sound healing, breathwork, and live virtual ceremonies — available whenever your soul calls for it.
            </p>
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-yoga-600/20 border border-yoga-500/30 text-yoga-300 text-sm font-body tracking-wide mb-10">
              <span className="w-2 h-2 rounded-full bg-yoga-400 animate-glow-pulse" />
              Launching Soon — Join the Founding Member Waitlist
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#waitlist" className="btn-gold">Join the Waitlist</a>
              <a href="#content" className="btn-ghost-light">Preview Content</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content Categories ───────────────────────────────────────── */}
      <section id="content" className="section section-sand relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-yoga-200"
             style={{ top: '-80px', right: '-80px', opacity: 0.5 }} />
        <div className="container-sacred relative z-10">
          <div className="text-center mb-16">
            <p className="eyebrow text-yoga-600 mb-4">What&apos;s Inside</p>
            <h2 className="font-heading text-display-md md:text-display-lg text-sacred-900 leading-tight mb-5 text-balance">
              The Full Healing Library
            </h2>
            <span className="gold-line w-16 block mx-auto mb-5" />
            <p className="text-sacred-500 text-base font-body font-light max-w-lg mx-auto leading-relaxed tracking-wide">
              Every modality. Every level. Curated to support every stage of your healing.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.title} className="experience-card group p-8 flex flex-col">
                <div className="flex items-start justify-between mb-5">
                  <span className="text-4xl">{cat.icon}</span>
                  {cat.preview && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-body font-semibold tracking-wider uppercase bg-yoga-100 text-yoga-700 border border-yoga-200">
                      Free Preview
                    </span>
                  )}
                </div>
                <h3 className="font-heading text-2xl text-sacred-900 mb-3 leading-snug">{cat.title}</h3>
                <p className="text-sm text-sacred-500 font-body font-light leading-relaxed mb-5 flex-1 tracking-wide">
                  {cat.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {cat.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-[10px] font-body tracking-wide bg-sacred-50 text-sacred-500 border border-sacred-100">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="pt-4 border-t border-sacred-100 flex items-center justify-between">
                  <p className="text-xs text-sacred-400 font-body tracking-wide">{cat.count}+ sessions</p>
                  <a href="#waitlist" className="text-xs font-body font-medium text-yoga-600 hover:text-yoga-800 transition-colors tracking-wide">
                    Join to Access →
                  </a>
                </div>
                <div className="shimmer-overlay rounded-3xl" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample Content Preview ───────────────────────────────────── */}
      <section className="section bg-white">
        <div className="container-sacred">
          <div className="text-center mb-12">
            <p className="eyebrow text-yoga-600 mb-4">Taste the Experience</p>
            <h2 className="font-heading text-display-md text-sacred-900 mb-2">
              Preview Sessions
            </h2>
            <span className="gold-line w-12 block mx-auto" />
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {SAMPLE_TRACKS.map((track, i) => (
              <div
                key={i}
                className={`group flex items-center gap-5 p-5 rounded-2xl border transition-all duration-300 ${
                  track.locked
                    ? 'bg-sacred-50 border-sacred-100 opacity-70'
                    : 'bg-white border-yoga-100 hover:shadow-soft hover:border-yoga-200 cursor-pointer'
                }`}
              >
                {/* Play button */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  track.locked
                    ? 'bg-sacred-100 text-sacred-400'
                    : 'bg-yoga-100 text-yoga-700 group-hover:bg-yoga-700 group-hover:text-white group-hover:shadow-glow'
                }`}>
                  {track.locked ? <Lock size={16} /> : <Play size={16} />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-heading text-lg leading-snug ${track.locked ? 'text-sacred-500' : 'text-sacred-900'}`}>
                    {track.title}
                  </p>
                  <p className="text-xs text-sacred-400 font-body tracking-wide mt-0.5">
                    {track.type} · {track.duration}
                  </p>
                </div>

                {track.locked ? (
                  <a href="#waitlist" className="flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-body font-semibold tracking-wider uppercase bg-yoga-100 text-yoga-700 hover:bg-yoga-200 transition-colors">
                    Unlock
                  </a>
                ) : (
                  <span className="flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-body font-semibold tracking-wider uppercase bg-yoga-700 text-white">
                    Free
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-sacred-400 text-sm font-body mt-8 tracking-wide">
            2 free sessions available now. Full library unlocks with membership.
          </p>
        </div>
      </section>

      {/* ── Membership Plans ────────────────────────────────────────── */}
      <section className="section section-sand relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-yoga-200"
             style={{ bottom: '-80px', left: '-80px', opacity: 0.4 }} />
        <div className="container-sacred relative z-10">
          <div className="text-center mb-16">
            <p className="eyebrow text-yoga-600 mb-4">Sacred Membership</p>
            <h2 className="font-heading text-display-md md:text-display-lg text-sacred-900 leading-tight mb-5 text-balance">
              Choose Your Path
            </h2>
            <span className="gold-line w-16 block mx-auto mb-5" />
            <p className="text-sacred-500 text-base font-body font-light max-w-md mx-auto leading-relaxed tracking-wide">
              Founding member pricing is available during the waitlist period — lock it in forever.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-8 flex flex-col ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-yoga-800 to-sacred-900 text-white shadow-gold ring-1 ring-yoga-500/40'
                    : 'bg-white border border-sacred-100 shadow-soft'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full text-[10px] font-body font-bold tracking-widest uppercase bg-yoga-500 text-white shadow-glow">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className={`eyebrow mb-2 ${plan.highlighted ? 'text-yoga-400' : 'text-yoga-600'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`font-heading text-4xl ${plan.highlighted ? 'text-white' : 'text-sacred-900'}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`text-sm font-body ${plan.highlighted ? 'text-white/50' : 'text-sacred-400'}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-body font-light tracking-wide ${plan.highlighted ? 'text-white/60' : 'text-sacred-500'}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className={`mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-yoga-400' : 'text-yoga-600'}`}>✦</span>
                      <span className={`text-sm font-body font-light tracking-wide ${plan.highlighted ? 'text-white/75' : 'text-sacred-600'}`}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  className={plan.highlighted ? 'btn-gold justify-center' : 'btn-outline-gold justify-center'}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Waitlist / Email capture ─────────────────────────────────── */}
      <div id="waitlist">
        <NewsletterSection brandId={brandId} colorScheme="yoga" />
      </div>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section data-header="dark" className="section-dark py-20 relative overflow-hidden">
        <div className="orb w-[500px] h-[500px] bg-yoga-700"
             style={{ top: '-100px', left: '50%', transform: 'translateX(-50%)', opacity: 0.08 }} />
        <div className="container-sacred relative z-10 text-center">
          <p className="eyebrow text-yoga-400 mb-5">Already a student?</p>
          <h2 className="font-heading text-display-md text-white mb-5 text-balance">
            Book a live session with Shanna
          </h2>
          <p className="text-white/50 font-body font-light text-base mb-10 max-w-md mx-auto tracking-wide leading-relaxed">
            Private sound healing, one-on-one yoga, and virtual energy sessions are available now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking" className="btn-gold">Book a Private Session</Link>
            <Link href="/events"  className="btn-ghost-light">View Upcoming Events</Link>
          </div>
        </div>
      </section>

    </main>
  )
}
