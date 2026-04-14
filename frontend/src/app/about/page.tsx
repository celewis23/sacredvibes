import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCurrentBrand } from '@/lib/brand/current'
import { toBrandPath } from '@/lib/brand/resolution'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)
  return {
    title: `About — ${brand.name}`,
    description: `Learn about ${brand.name} and our mission.`,
  }
}

export default async function AboutPage() {
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)

  return (
    <main>
      {/* Hero */}
      <section className="section bg-sacred-50">
        <div className="container-sacred max-w-6xl mx-auto">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)] lg:items-center">
            <div className="text-center lg:text-left">
              <p className="text-xs font-medium uppercase tracking-widest text-sacred-400 mb-4">Our Story</p>
              <h1 className="font-heading text-4xl md:text-6xl text-sacred-900 mb-6">
                {brand.slug === 'sacred-vibes-yoga' && 'Born from a Love of Movement'}
                {brand.slug === 'sacred-hands' && 'Healing Through Touch'}
                {brand.slug === 'sacred-sound' && 'The Power of Sacred Sound'}
              </h1>
              <p className="text-lg text-sacred-600 leading-relaxed max-w-2xl lg:max-w-none mx-auto lg:mx-0">
                {brand.slug === 'sacred-vibes-yoga' && (
                  'Sacred Vibes Yoga was founded on the belief that yoga is for every body. Our studio is a sanctuary — a place to slow down, go inward, and reconnect with what matters most.'
                )}
                {brand.slug === 'sacred-hands' && (
                  'Sacred Hands was born from a deep respect for the healing potential of therapeutic touch. Every session is an intentional act of care, tailored to the person in front of us.'
                )}
                {brand.slug === 'sacred-sound' && (
                  'Sacred Sound was created to bring people into deeper states of presence and healing through the ancient technology of sound. Our practitioners combine Tibetan bowls, crystal bowls, gongs, and voice to guide profound inner journeys.'
                )}
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-luxury">
              <img
                src="/images/about.jpg"
                alt={`${brand.name} about page`}
                className="w-full h-[320px] md:h-[420px] object-cover object-center"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent p-6 md:p-8">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-yoga-300 mb-2">
                  Sacred Vibes
                </p>
                <p className="font-heading text-2xl text-white leading-snug max-w-md">
                  A practice rooted in presence, healing, and honest connection
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="section">
        <div className="container-sacred">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-sacred-400 mb-3">Our Mission</p>
              <h2 className="font-heading text-3xl text-sacred-900 mb-5">
                {brand.slug === 'sacred-vibes-yoga' && 'To make yoga an accessible, transformative practice.'}
                {brand.slug === 'sacred-hands' && 'To restore balance, reduce pain, and support whole-person wellness.'}
                {brand.slug === 'sacred-sound' && 'To use sound as a bridge between the ordinary and the extraordinary.'}
              </h2>
              <p className="text-sacred-600 leading-relaxed mb-4">
                {brand.slug === 'sacred-vibes-yoga' && (
                  'We believe that a consistent yoga practice has the power to transform not just your body, but your relationship with yourself and the world around you. Our classes are designed to meet you exactly where you are — beginner or advanced, healing from injury or training for performance.'
                )}
                {brand.slug === 'sacred-hands' && (
                  'Massage therapy is more than relaxation. It is a clinical tool for managing chronic pain, improving circulation, supporting mental health, and helping the nervous system shift from stress into restoration. We take your wellness goals seriously.'
                )}
                {brand.slug === 'sacred-sound' && (
                  'Sound has been used for thousands of years across cultures as a vehicle for healing, ceremony, and spiritual exploration. We carry that tradition forward with rigor, care, and a deep reverence for the people who trust us with their inner world.'
                )}
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: 'Authenticity',
                  description: 'We teach what we practice. Our offerings come from lived experience, not just training.',
                },
                {
                  title: 'Inclusivity',
                  description: 'Every offering is designed with accessibility in mind. All bodies. All backgrounds. All levels.',
                },
                {
                  title: 'Community',
                  description: 'We build real relationships. This is not a transactional studio — it is a community.',
                },
                {
                  title: 'Integrity',
                  description: 'We operate with honesty and transparency in everything from pricing to teaching lineage.',
                },
              ].map(value => (
                <div key={value.title} className="flex gap-4">
                  <div className="w-1 bg-sacred-300 rounded-full shrink-0" />
                  <div>
                    <p className="font-semibold text-sacred-900 mb-0.5">{value.title}</p>
                    <p className="text-sm text-sacred-600">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-sacred-900 text-white">
        <div className="container-sacred text-center max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl mb-4">Ready to Begin?</h2>
          <p className="text-sacred-200 mb-8 leading-relaxed">
            {brand.slug === 'sacred-vibes-yoga' && 'Join us on the mat. Your first class is the hardest step — everything after that is the practice.'}
            {brand.slug === 'sacred-hands' && 'Book your first session and experience the difference that skilled, intentional touch can make.'}
            {brand.slug === 'sacred-sound' && 'Join us for a sound bath or private session. Let the vibrations do the work.'}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href={toBrandPath(brand, '/contact')}
              className="px-8 py-3 bg-white text-sacred-900 rounded-full font-medium hover:bg-sacred-100 transition-colors"
            >
              Get in Touch
            </Link>
            <Link
              href={toBrandPath(brand, brand.slug === 'sacred-hands' ? '/booking' : '/classes')}
              className="px-8 py-3 border border-white/30 text-white rounded-full font-medium hover:bg-white/10 transition-colors"
            >
              {brand.slug === 'sacred-hands' ? 'Book a Session' : 'View Schedule'}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
