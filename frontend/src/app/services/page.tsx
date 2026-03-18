import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCurrentBrand } from '@/lib/brand/current'
import { servicesApi } from '@/lib/api'
import type { ServiceOffering } from '@/types'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Massage Services — Sacred Hands',
    description: 'Professional massage therapy services tailored to your needs. Swedish, deep tissue, prenatal, and specialty massage.',
  }
}

function formatPrice(s: ServiceOffering): string {
  if (s.priceType === 'Free') return 'Complimentary'
  if (s.priceType === 'SlidingScale' && s.priceMin != null && s.priceMax != null) {
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: s.currency }).format(n)
    return `${fmt(s.priceMin)} – ${fmt(s.priceMax)}`
  }
  if (s.price) return new Intl.NumberFormat('en-US', { style: 'currency', currency: s.currency }).format(s.price)
  return 'Contact for pricing'
}

export default async function ServicesPage() {
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)

  let services: ServiceOffering[] = []
  try {
    const res = await servicesApi.getServices({ brandId: brand.id })
    services = (res.data.data ?? []).filter(s => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  } catch { /* show empty state */ }

  const byCategory = services.reduce<Record<string, ServiceOffering[]>>((acc, s) => {
    const cat = s.category ?? 'Services'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(s)
    return acc
  }, {})

  return (
    <main>
      {/* Hero */}
      <section className="section bg-hands-50">
        <div className="container-sacred text-center max-w-3xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-widest text-hands-400 mb-4">Sacred Hands</p>
          <h1 className="font-heading text-4xl md:text-6xl text-hands-900 mb-5">
            Therapeutic Massage Services
          </h1>
          <p className="text-lg text-hands-600 leading-relaxed mb-8">
            Each session is crafted specifically for you — your body, your goals, your comfort.
            We combine proven technique with genuine care.
          </p>
          <Link
            href="/booking"
            className="inline-block px-8 py-3 bg-hands-800 text-white rounded-full font-medium hover:bg-hands-900 transition-colors"
          >
            Book a Session
          </Link>
        </div>
      </section>

      {/* Services */}
      <section className="section">
        <div className="container-sacred">
          {services.length === 0 ? (
            <div className="text-center py-12 text-sacred-400">
              <p className="font-heading text-2xl mb-2">Services coming soon</p>
              <p className="text-sm mb-6">Contact us for current availability.</p>
              <Link href="/contact" className="px-6 py-2.5 bg-sacred-800 text-white rounded-full text-sm hover:bg-sacred-900 transition-colors">
                Get in Touch
              </Link>
            </div>
          ) : (
            <div className="space-y-16">
              {Object.entries(byCategory).map(([category, categoryServices]) => (
                <div key={category}>
                  <h2 className="font-heading text-2xl text-hands-900 mb-8">{category}</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryServices.map(service => (
                      <div
                        key={service.id}
                        className="group bg-white border border-hands-100 rounded-2xl overflow-hidden hover:shadow-card transition-shadow"
                      >
                        {service.featuredImageUrl && (
                          <div
                            className="h-48 bg-cover bg-center"
                            style={{ backgroundImage: `url(${service.featuredImageUrl})` }}
                          />
                        )}
                        <div className="p-6">
                          <h3 className="font-heading text-xl text-hands-900 mb-2">{service.name}</h3>
                          {service.shortDescription && (
                            <p className="text-sm text-hands-600 leading-relaxed mb-4">{service.shortDescription}</p>
                          )}
                          <div className="flex items-center justify-between text-sm mb-5">
                            <span className="font-semibold text-hands-800">{formatPrice(service)}</span>
                            {service.durationMinutes && (
                              <span className="text-hands-400">{service.durationMinutes} min</span>
                            )}
                          </div>
                          {service.isBookable && (
                            <Link
                              href={`/booking?serviceId=${service.id}`}
                              className="block text-center px-5 py-2.5 bg-hands-800 text-white text-sm rounded-full hover:bg-hands-900 transition-colors"
                            >
                              Book This Service
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* What to expect */}
      <section className="section bg-hands-50">
        <div className="container-sacred max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl text-hands-900 mb-10 text-center">What to Expect</h2>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { step: '01', title: 'Intake', body: 'We begin every session with a brief consultation to understand your goals and any areas of concern or sensitivity.' },
              { step: '02', title: 'The Session', body: 'You are in control throughout. Communicate freely about pressure, comfort, and anything you need adjusted.' },
              { step: '03', title: 'Aftercare', body: 'We provide guidance for post-session care — hydration, stretching, and rest — to extend the benefits of your treatment.' },
            ].map(item => (
              <div key={item.step}>
                <p className="font-heading text-4xl text-hands-200 mb-3">{item.step}</p>
                <h3 className="font-semibold text-hands-900 mb-2">{item.title}</h3>
                <p className="text-sm text-hands-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
