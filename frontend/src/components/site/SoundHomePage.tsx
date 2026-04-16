import Link from 'next/link'
import type { BrandContext } from '@/lib/brand/resolution'
import PageEditorProvider from '@/components/page-editor/PageEditorProvider'
import PageEditorTextField from '@/components/page-editor/PageEditorTextField'
import PageEditorToolbar from '@/components/page-editor/PageEditorToolbar'
import HeroSection from '@/components/sections/HeroSection'
import SectionHeading from '@/components/sections/SectionHeading'
import ServiceCard from '@/components/booking/ServiceCard'
import EventCard from '@/components/booking/EventCard'
import BlogCard from '@/components/blog/BlogCard'
import NewsletterSection from '@/components/sections/NewsletterSection'
import { getBrandIdBySlug, toBrandPath } from '@/lib/brand/resolution'
import { servicesApi, blogApi } from '@/lib/api'
import { resolveSoundHomeSections } from '@/lib/page-editor/home-sections'
import type { SitePage } from '@/types'

interface Props {
  brand: BrandContext
  editablePage?: SitePage | null
}

export async function getSoundHomeData() {
  const brandId = getBrandIdBySlug('sacred-sound')
  try {
    const [servicesRes, eventsRes, postsRes, riverEventsRes] = await Promise.allSettled([
      servicesApi.getServices({ brandId }),
      servicesApi.getEvents({ brandId, upcomingOnly: true }),
      blogApi.getPosts({ brandSlug: 'sacred-sound', pageSize: 3 }),
      servicesApi.getEvents({ brandId, soundOnTheRiver: true, upcomingOnly: true }),
    ])
    return {
      services: servicesRes.status === 'fulfilled' ? servicesRes.value.data?.data ?? [] : [],
      events: eventsRes.status === 'fulfilled' ? eventsRes.value.data?.data?.filter(e => !e.isSoundOnTheRiver) ?? [] : [],
      riverEvents: riverEventsRes.status === 'fulfilled' ? riverEventsRes.value.data?.data ?? [] : [],
      posts: postsRes.status === 'fulfilled' ? postsRes.value.data?.data?.items ?? [] : [],
    }
  } catch { return { services: [], events: [], riverEvents: [], posts: [] } }
}

export default async function SoundHomePage({ brand, editablePage }: Props) {
  const { services, events, riverEvents, posts } = await getSoundHomeData()
  const initialSections = editablePage ? resolveSoundHomeSections(editablePage.contentJson) : null

  const content = (
    <>
      <HeroSection
        eyebrow="Sacred Sound Healing"
        heading="Vibrate Higher"
        subheading="A portal into vibrational healing through sound baths, singing bowls, gong immersions, and our signature Sound on the River experiences. Let the vibrations guide you inward."
        primaryCta={{ label: 'Upcoming Events', href: toBrandPath(brand, '/events') }}
        secondaryCta={{ label: 'Sound on the River', href: toBrandPath(brand, '/sound-on-the-river') }}
        colorScheme="sound"
        imageUrl="/images/sound-bath.jpg"
        editable={editablePage ? {
          sectionId: 'sound-home-hero',
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
              eyebrow="Healing Sessions"
              heading="Sound Healing Offerings"
              subheading="From group sound baths to private sessions, find the vibrational medicine that calls to you."
              colorScheme="sound"
              editable={editablePage ? {
                sectionId: 'sound-home-services',
                eyebrowField: 'eyebrow',
                headingField: 'heading',
                subheadingField: 'subheading',
              } : undefined}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} colorScheme="sound" brandSlug={brand.slug} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sound on the River feature */}
      <section className="section bg-gradient-to-br from-sound-50 via-sacred-50 to-white">
        <div className="container-sacred">
          <div className="max-w-4xl mx-auto text-center">
            <PageEditorTextField
              sectionId="sound-home-river"
              field="eyebrow"
              fallback="Signature Program"
              as="p"
              multiline={false}
              label="River feature eyebrow"
              className="text-xs font-semibold tracking-widest uppercase text-sound-500 mb-3"
            />
            <PageEditorTextField
              sectionId="sound-home-river"
              field="heading"
              fallback="Sound on the River"
              as="h2"
              multiline={false}
              label="River feature heading"
              className="font-heading text-display-lg text-sacred-900 mb-6"
            />
            <PageEditorTextField
              sectionId="sound-home-river"
              field="body"
              fallback="Our most beloved offering: an outdoor sound healing ceremony held on the banks of the French Broad River. Surrounded by nature, the sounds of moving water, and the voices of crystal and Tibetan bowls, this experience is unlike anything else."
              as="p"
              label="River feature body"
              className="text-lg text-sacred-600 leading-relaxed mb-8 max-w-2xl mx-auto"
            />
            {riverEvents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 text-left">
                {riverEvents.slice(0, 2).map((event) => (
                  <EventCard key={event.id} event={event} colorScheme="sound" brandSlug={brand.slug} />
                ))}
              </div>
            )}
            <div className="mt-8">
              <Link
                href={toBrandPath(brand, '/sound-on-the-river')}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium bg-sound-700 text-white hover:bg-sound-800 shadow-sm transition-all duration-200"
              >
                Learn About Sound on the River
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Other Events */}
      {events.length > 0 && (
        <section className="section bg-white">
          <div className="container-sacred">
            <SectionHeading
              eyebrow="Calendar"
              heading="Upcoming Sound Events"
              colorScheme="sound"
              editable={editablePage ? {
                sectionId: 'sound-home-events',
                eyebrowField: 'eyebrow',
                headingField: 'heading',
              } : undefined}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
              {events.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} colorScheme="sound" brandSlug={brand.slug} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog */}
      {posts.length > 0 && (
        <section className="section bg-sound-50">
          <div className="container-sacred">
            <SectionHeading
              eyebrow="Learn"
              heading="Sound Healing Wisdom"
              colorScheme="sound"
              editable={editablePage ? {
                sectionId: 'sound-home-blog',
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

      <NewsletterSection brandId={getBrandIdBySlug('sacred-sound')} colorScheme="sound" />
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
