import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { resolveBrandFromHost } from '@/lib/brand/resolution'
import ContactForm from '@/components/forms/ContactForm'

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const brand = resolveBrandFromHost(host)
  return {
    title: `Contact — ${brand.name}`,
    description: `Reach out to ${brand.name}. We'd love to hear from you.`,
  }
}

export default async function ContactPage() {
  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const brand = resolveBrandFromHost(host)

  return (
    <main className="section">
      <div className="container-sacred">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left: info */}
            <div>
              <h1 className="font-heading text-4xl md:text-5xl text-sacred-900 mb-4">
                Let&apos;s Connect
              </h1>
              <p className="text-lg text-sacred-600 leading-relaxed mb-8">
                Whether you have questions about classes, want to book a service, or simply want to say hello —
                we&apos;d love to hear from you.
              </p>

              <div className="space-y-6 text-sacred-700">
                {brand.slug === 'sacred-vibes-yoga' && (
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-sacred-400 mb-1">Classes</p>
                      <p className="text-sm">Yoga classes, workshops, and retreats for all levels.</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-sacred-400 mb-1">Private Sessions</p>
                      <p className="text-sm">One-on-one instruction tailored to your practice and goals.</p>
                    </div>
                  </>
                )}

                {brand.slug === 'sacred-hands' && (
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-sacred-400 mb-1">Massage Therapy</p>
                      <p className="text-sm">Swedish, deep tissue, prenatal, and specialty massage services.</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-sacred-400 mb-1">Booking</p>
                      <p className="text-sm">Sessions available 7 days a week by appointment.</p>
                    </div>
                  </>
                )}

                {brand.slug === 'sacred-sound' && (
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-sacred-400 mb-1">Sound Healing</p>
                      <p className="text-sm">Group sessions, private sound journeys, and special events.</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-sacred-400 mb-1">Sound on the River</p>
                      <p className="text-sm">Our signature outdoor immersive experience — ask for upcoming dates.</p>
                    </div>
                  </>
                )}

                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-sacred-400 mb-1">Email</p>
                  <a
                    href="mailto:info@sacredvibesyoga.com"
                    className="text-sm text-sacred-700 hover:text-sacred-900 underline underline-offset-2"
                  >
                    info@sacredvibesyoga.com
                  </a>
                </div>
              </div>
            </div>

            {/* Right: form */}
            <div className="bg-white border border-sacred-100 rounded-2xl p-8 shadow-soft">
              <ContactForm brandId={brand.id} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
