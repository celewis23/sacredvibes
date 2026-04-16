import Link from 'next/link'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import EditablePageSections from '@/components/page-editor/EditablePageSections'
import { getCurrentBrand } from '@/lib/brand/current'
import { getPublicPageBySlug } from '@/lib/api'

export const metadata: Metadata = {
  title: 'About — Sacred Vibes',
  description: 'Learn about Sacred Vibes Yoga and our mission to make wellness accessible to every body.',
}

export default async function AboutPage() {
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)
  const page = await getPublicPageBySlug('about', brand.slug)

  // If the page has been edited via the CMS, render from contentJson
  if (page?.contentJson) {
    return (
      <main>
        <EditablePageSections page={page} />
      </main>
    )
  }

  // Fallback: original hardcoded content
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
