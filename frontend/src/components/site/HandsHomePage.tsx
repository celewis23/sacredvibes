import Link from 'next/link'
import type { BrandContext } from '@/lib/brand/resolution'
import PageEditorProvider from '@/components/page-editor/PageEditorProvider'
import PageEditorTextField from '@/components/page-editor/PageEditorTextField'
import PageEditorToolbar from '@/components/page-editor/PageEditorToolbar'
import HeroSection from '@/components/sections/HeroSection'
import SectionHeading from '@/components/sections/SectionHeading'
import ServiceCard from '@/components/booking/ServiceCard'
import BlogCard from '@/components/blog/BlogCard'
import NewsletterSection from '@/components/sections/NewsletterSection'
import { getBrandIdBySlug, toBrandPath } from '@/lib/brand/resolution'
import { servicesApi, blogApi } from '@/lib/api'
import { resolveHandsHomeSections } from '@/lib/page-editor/home-sections'
import type { SitePage } from '@/types'

interface Props {
  brand: BrandContext
  editablePage?: SitePage | null
}

export async function getHandsHomeData() {
  const brandId = getBrandIdBySlug('sacred-hands')
  try {
    const [servicesRes, postsRes] = await Promise.allSettled([
      servicesApi.getServices({ brandId }),
      blogApi.getPosts({ brandSlug: 'sacred-hands', pageSize: 3 }),
    ])
    return {
      services: servicesRes.status === 'fulfilled' ? servicesRes.value.data?.data ?? [] : [],
      posts: postsRes.status === 'fulfilled' ? postsRes.value.data?.data?.items ?? [] : [],
    }
  } catch { return { services: [], posts: [] } }
}

export default async function HandsHomePage({ brand, editablePage }: Props) {
  const { services, posts } = await getHandsHomeData()
  const initialSections = editablePage ? resolveHandsHomeSections(editablePage.contentJson) : null

  const content = (
    <>
      <HeroSection
        eyebrow="Sacred Hands Massage Therapy"
        heading="Healing Through Touch"
        subheading="Transformative massage therapy designed to melt tension, restore balance, and return you to yourself. Our skilled therapists blend traditional techniques with intuitive healing touch."
        primaryCta={{ label: 'Book a Session', href: toBrandPath(brand, '/booking') }}
        secondaryCta={{ label: 'Our Services', href: toBrandPath(brand, '/services') }}
        colorScheme="hands"
        imageUrl="/images/sacred-hands.jpg"
        editable={editablePage ? {
          sectionId: 'hands-home-hero',
          eyebrowField: 'eyebrow',
          headingField: 'heading',
          subheadingField: 'subheading',
        } : undefined}
      />

      {/* Services */}
      {services.length > 0 && (
        <section className="section bg-white">
          <div className="container-sacred">
            <SectionHeading
              eyebrow="Healing Modalities"
              heading="Our Massage Services"
              subheading="Every session is a sacred space — tailored to your body, your needs, and your intentions."
              colorScheme="hands"
              editable={editablePage ? {
                sectionId: 'hands-home-services',
                eyebrowField: 'eyebrow',
                headingField: 'heading',
                subheadingField: 'subheading',
              } : undefined}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} colorScheme="hands" brandSlug={brand.slug} />
              ))}
            </div>
            <div className="mt-10">
              <Link
                href={toBrandPath(brand, '/booking')}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium bg-hands-700 text-white hover:bg-hands-800 shadow-sm transition-all duration-200"
              >
                Book Your Session
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Philosophy */}
      <section className="section bg-hands-50">
        <div className="container-sacred">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeading
                eyebrow="Our Philosophy"
                heading="More Than Massage"
                subheading="Touch is one of our most fundamental human needs. When skilled hands meet an open body, something profound becomes possible — genuine healing at every level."
                colorScheme="hands"
                editable={editablePage ? {
                  sectionId: 'hands-home-philosophy',
                  eyebrowField: 'eyebrow',
                  headingField: 'heading',
                  subheadingField: 'subheading',
                } : undefined}
              />
              <ul className="mt-8 space-y-4 text-sacred-600 text-sm leading-relaxed">
                {[
                  { field: 'item1', fallback: 'Every session is personalized to your body, goals, and comfort level.' },
                  { field: 'item2', fallback: 'We blend proven therapeutic technique with intuitive, healing touch.' },
                  { field: 'item3', fallback: 'A safe, grounded space for deep release and genuine restoration.' },
                  { field: 'item4', fallback: 'Rooted in care — not just for the session, but for your long-term wellbeing.' },
                ].map(({ field, fallback }) => (
                  <li key={field} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-hands-400 mt-2 shrink-0" />
                    <PageEditorTextField
                      sectionId="hands-home-philosophy"
                      field={field}
                      fallback={fallback}
                      as="span"
                      label="Philosophy item"
                    />
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-3xl border border-hands-100 p-8 shadow-soft">
              <PageEditorTextField
                sectionId="hands-home-philosophy"
                field="quote"
                fallback="“The body is the first teacher. When we learn to listen to it, healing becomes possible in ways we never imagined.”"
                as="p"
                label="Philosophy quote"
                className="font-heading text-2xl text-hands-900 leading-snug mb-6"
              />
              <PageEditorTextField
                sectionId="hands-home-philosophy"
                field="quoteAuthor"
                fallback="— Sacred Hands Practitioner"
                as="p"
                multiline={false}
                label="Philosophy quote author"
                className="text-sm text-sacred-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Blog */}
      {posts.length > 0 && (
        <section className="section bg-white">
          <div className="container-sacred">
            <SectionHeading
              eyebrow="From the Practice"
              heading="Wellness Insights"
              colorScheme="hands"
              editable={editablePage ? {
                sectionId: 'hands-home-blog',
                eyebrowField: 'eyebrow',
                headingField: 'heading',
              } : undefined}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
              {posts.map((post) => <BlogCard key={post.id} post={post} brandSlug={brand.slug} />)}
            </div>
          </div>
        </section>
      )}

      <NewsletterSection brandId={getBrandIdBySlug('sacred-hands')} colorScheme="hands" />
    </>
  )

  if (!editablePage || !initialSections) {
    return content
  }

  return (
    <PageEditorProvider page={editablePage} initialSections={initialSections}>
      {content}
      <PageEditorToolbar />
    </PageEditorProvider>
  )
}
