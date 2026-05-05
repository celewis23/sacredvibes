import Link from 'next/link'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import EditablePageSections from '@/components/page-editor/EditablePageSections'
import SacredHandsAbout from '@/components/site/SacredHandsAbout'
import SacredSoundAbout from '@/components/site/SacredSoundAbout'
import { getCurrentBrand } from '@/lib/brand/current'
import { getPublicPageBySlug } from '@/lib/api'

export const metadata: Metadata = {
  title: 'About — Sacred Vibes',
  description: 'Learn about Sacred Vibes Healing & Wellness and our family of transformative experiences.',
}

export default async function AboutPage() {
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)
  const page = await getPublicPageBySlug('about', brand.slug)

  // CMS content takes priority for any brand
  if (page?.contentJson) {
    return (
      <main>
        <EditablePageSections page={page} />
      </main>
    )
  }

  // Brand-specific about pages
  if (brand.slug === 'sacred-hands') return <SacredHandsAbout />
  if (brand.slug === 'sacred-sound') return <SacredSoundAbout />

  // Main Sacred Vibes Yoga about page
  return (
    <main>
      {/* Hero */}
      <section data-header="dark" className="section-dark pt-32 pb-28 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/about.jpg')", opacity: 0.22 }}
        />
        <div className="orb w-[700px] h-[700px] bg-yoga-700"
             style={{ top: '-150px', right: '-150px', opacity: 0.1 }} />
        <div className="orb w-[500px] h-[500px] bg-sage-700"
             style={{ bottom: '-100px', left: '-100px', opacity: 0.07 }} />
        <div className="container-sacred relative z-10 max-w-3xl mx-auto text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-yoga-300 mb-4">Our Story</p>
          <h1 className="font-heading text-display-lg md:text-display-xl text-white mb-6 text-balance">
            Born from a Love of Movement
          </h1>
          <span className="gold-line w-16 block mx-auto mb-8" />
          <p className="text-lg text-white/60 leading-relaxed tracking-wide">
            Sacred Vibes Yoga was founded on the belief that yoga is for every body. Our studio is a sanctuary — a place to slow down, go inward, and reconnect with what matters most.
          </p>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="section">
        <div className="container-sacred">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-sacred-400 mb-3">Our Mission</p>
              <h2 className="font-heading text-3xl text-sacred-900 mb-5">
                To make yoga an accessible, transformative practice.
              </h2>
              <p className="text-sacred-600 leading-relaxed mb-4">
                We believe that a consistent yoga practice has the power to transform not just your body, but your relationship with yourself and the world around you. Our classes are designed to meet you exactly where you are — beginner or advanced, healing from injury or training for performance.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { title: 'Authenticity', description: 'We teach what we practice. Our offerings come from lived experience, not just training.' },
                { title: 'Inclusivity', description: 'Every offering is designed with accessibility in mind. All bodies. All backgrounds. All levels.' },
                { title: 'Community', description: 'We build real relationships. This is not a transactional studio — it is a community.' },
                { title: 'Integrity', description: 'We operate with honesty and transparency in everything from pricing to teaching lineage.' },
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

      {/* Experience Teasers */}
      <section className="section bg-sacred-50">
        <div className="container-sacred max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-medium uppercase tracking-widest text-sacred-400 mb-3">Our Experiences</p>
            <h2 className="font-heading text-3xl text-sacred-900 mb-4">
              A Family of Healing Modalities
            </h2>
            <p className="text-sacred-600 max-w-xl mx-auto leading-relaxed">
              Sacred Vibes is home to distinct healing experiences — each with its own depth, practice, and philosophy. Explore what calls to you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Sacred Hands */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-soft group">
              <div className="h-2 bg-gradient-to-r from-hands-400 to-hands-600" />
              <div className="p-8">
                <p className="text-xs font-medium uppercase tracking-widest text-hands-500 mb-2">Sacred Hands</p>
                <h3 className="font-heading text-2xl text-sacred-900 mb-3">Healing Through Touch</h3>
                <p className="text-sacred-600 text-sm leading-relaxed mb-6">
                  Transformative massage therapy rooted in the belief that touch is medicine. Our practitioners blend technique with intuition to create sessions that restore body, mind, and spirit.
                </p>
                <Link
                  href="/hands/about"
                  className="inline-flex items-center gap-2 text-sm font-medium text-hands-600 hover:text-hands-800 transition-colors"
                >
                  Learn about Sacred Hands →
                </Link>
              </div>
            </div>

            {/* Sacred Sound */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-soft group">
              <div className="h-2 bg-gradient-to-r from-sound-400 to-sound-600" />
              <div className="p-8">
                <p className="text-xs font-medium uppercase tracking-widest text-sound-500 mb-2">Sacred Sound</p>
                <h3 className="font-heading text-2xl text-sacred-900 mb-3">Vibrate Higher</h3>
                <p className="text-sacred-600 text-sm leading-relaxed mb-6">
                  Sound healing through singing bowls, gongs, and sacred instruments. Let vibrational medicine quiet the mind, regulate the nervous system, and return you to your natural frequency.
                </p>
                <Link
                  href="/sound/about"
                  className="inline-flex items-center gap-2 text-sm font-medium text-sound-600 hover:text-sound-800 transition-colors"
                >
                  Learn about Sacred Sound →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-sacred-900 text-white">
        <div className="container-sacred text-center max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl mb-4">Ready to Begin?</h2>
          <p className="text-sacred-200 mb-8 leading-relaxed">
            Join us on the mat. Your first class is the hardest step — everything after that is the practice.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="px-8 py-3 bg-white text-sacred-900 rounded-full font-medium hover:bg-sacred-100 transition-colors">
              Get in Touch
            </Link>
            <Link href="/classes" className="px-8 py-3 border border-white/30 text-white rounded-full font-medium hover:bg-white/10 transition-colors">
              View Schedule
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
