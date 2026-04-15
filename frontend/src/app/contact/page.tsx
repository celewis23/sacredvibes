import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { getCurrentBrand } from '@/lib/brand/current'
import { getPublicPageBySlug } from '@/lib/api'
import ContactForm from '@/components/forms/ContactForm'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact — Sacred Vibes',
    description: "Reach out to Sacred Vibes. We'd love to hear from you.",
  }
}

export default async function ContactPage() {
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)
  const cmsPage = await getPublicPageBySlug('contact')

  // Extract editable heading/body from CMS if available
  let heading = "Let's Connect"
  let subheading = "Whether you have questions about classes, want to book a service, or simply want to say hello — we'd love to hear from you."
  let infoText = 'Yoga classes, workshops, and private sessions for all levels.\n\nEmail: info@sacredvibesyoga.com'

  if (cmsPage?.contentJson) {
    try {
      const sections = JSON.parse(cmsPage.contentJson)
      const headingSection = sections.find((s: { type: string }) => s.type === 'heading')
      const textSection = sections.find((s: { type: string }) => s.type === 'text')
      if (headingSection?.content?.headline) heading = headingSection.content.headline as string
      if (headingSection?.content?.subheading) subheading = headingSection.content.subheading as string
      if (textSection?.content?.body) infoText = textSection.content.body as string
    } catch { /* use defaults */ }
  }

  return (
    <main className="section">
      <div className="container-sacred">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left: info */}
            <div>
              <h1 className="font-heading text-4xl md:text-5xl text-sacred-900 mb-4">{heading}</h1>
              <p className="text-lg text-sacred-600 leading-relaxed mb-8">{subheading}</p>
              <p className="text-sm text-sacred-600 leading-relaxed whitespace-pre-wrap mb-6">{infoText}</p>
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-sacred-400 mb-1">Email</p>
                <a href="mailto:info@sacredvibesyoga.com" className="text-sm text-sacred-700 hover:text-sacred-900 underline underline-offset-2">
                  info@sacredvibesyoga.com
                </a>
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
