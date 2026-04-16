import { headers } from 'next/headers'
import type { Metadata } from 'next'
import EditableContactPage from '@/components/page-editor/EditableContactPage'
import { getCurrentBrand } from '@/lib/brand/current'
import { getPublicPageBySlug } from '@/lib/api'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Contact — Sacred Vibes',
    description: "Reach out to Sacred Vibes. We'd love to hear from you.",
  }
}

export default async function ContactPage() {
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)
  const cmsPage = await getPublicPageBySlug('contact', brand.slug)

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

  if (!cmsPage) {
    return (
      <EditableContactPage
        page={{
          id: 'contact-fallback',
          brandId: brand.id,
          brandName: brand.name,
          brandSlug: brand.slug,
          title: 'Contact',
          slug: 'contact',
          status: 'Draft',
          showInNav: true,
          navSortOrder: 0,
          createdAt: '',
          updatedAt: '',
        }}
        brandId={brand.id}
        headingFallback={heading}
        subheadingFallback={subheading}
        infoFallback={infoText}
      />
    )
  }

  return (
    <EditableContactPage
      page={cmsPage}
      brandId={brand.id}
      headingFallback={heading}
      subheadingFallback={subheading}
      infoFallback={infoText}
    />
  )
}
