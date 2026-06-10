import type { Metadata } from 'next'
import NewsletterSection from '@/components/sections/NewsletterSection'
import { getBrandIdBySlug } from '@/lib/brand/resolution'

export const metadata: Metadata = {
  title: 'Join the Community — Sacred Vibes',
  description: 'Subscribe to the Sacred Vibes newsletter for weekly wisdom, event announcements, and a free guided sound healing meditation.',
}

const perks = [
  {
    icon: '🎵',
    title: 'Free Guided Meditation',
    body: 'Receive a complimentary sound healing meditation the moment you join — your first step into the sanctuary.',
  },
  {
    icon: '📅',
    title: 'Event Announcements',
    body: 'Be the first to know about Sound on the River dates, workshops, and special events before they sell out.',
  },
  {
    icon: '✨',
    title: 'Weekly Wisdom',
    body: 'Grounding practices, healing insights, and sacred teachings delivered straight to your inbox.',
  },
  {
    icon: '🌿',
    title: 'Sacred Offers',
    body: 'Subscriber-only discounts on classes, private sessions, and new offerings as they drop.',
  },
]

export default function NewsletterPage() {
  return (
    <main>
      {/* Hero */}
      <section data-header="dark" className="relative min-h-[50vh] flex items-center justify-center overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #1c1714 0%, #2d2420 50%, #1c1714 100%)' }}>
        <div className="orb w-[500px] h-[500px] bg-yoga-600"
             style={{ top: '-150px', left: '50%', transform: 'translateX(-50%)', opacity: 0.06 }} />
        <div className="relative z-10 mx-auto max-w-2xl px-6 pt-32 pb-20 text-center">
          <p className="eyebrow text-yoga-400 mb-6">Sacred Vibes Newsletter</p>
          <h1 className="font-heading text-display-xl md:text-display-2xl text-white leading-tight mb-6 text-balance">
            Join the Community
          </h1>
          <span className="gold-line w-16 block mx-auto mb-6" />
          <p className="text-white/60 font-body font-light leading-relaxed tracking-wide max-w-lg mx-auto">
            Weekly healing wisdom, sacred sound, and first access to events — delivered to your inbox with love.
          </p>
        </div>
      </section>

      {/* What you'll get */}
      <section className="section bg-white">
        <div className="container-sacred max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="eyebrow text-sacred-500 mb-4">What You Get</p>
            <h2 className="font-heading text-3xl text-sacred-900 md:text-4xl text-balance">
              More than an email list
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {perks.map(perk => (
              <div key={perk.title} className="flex gap-4 rounded-2xl border border-sacred-100 bg-sacred-50 p-6">
                <span className="text-2xl shrink-0">{perk.icon}</span>
                <div>
                  <h3 className="font-heading text-lg text-sacred-900 mb-1">{perk.title}</h3>
                  <p className="text-sm font-body text-sacred-600 leading-relaxed">{perk.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup form */}
      <NewsletterSection brandId={getBrandIdBySlug('sacred-vibes-yoga')} colorScheme="yoga" />
    </main>
  )
}
