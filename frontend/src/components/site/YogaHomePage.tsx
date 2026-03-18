import Link from 'next/link'
import type { BrandContext } from '@/lib/brand/resolution'
import HeroSection from '@/components/sections/HeroSection'
import SectionHeading from '@/components/sections/SectionHeading'
import ServiceCard from '@/components/booking/ServiceCard'
import EventCard from '@/components/booking/EventCard'
import BlogCard from '@/components/blog/BlogCard'
import SubBrandCard from '@/components/sections/SubBrandCard'
import NewsletterSection from '@/components/sections/NewsletterSection'
import { getBrandIdBySlug } from '@/lib/brand/resolution'
import { servicesApi, blogApi } from '@/lib/api'

interface Props { brand: BrandContext }

async function getData() {
  try {
    const brandId = getBrandIdBySlug('sacred-vibes-yoga')
    const [servicesRes, eventsRes, postsRes] = await Promise.allSettled([
      servicesApi.getServices({ brandId }),
      servicesApi.getEvents({ brandId, upcomingOnly: true }),
      blogApi.getPosts({ brandSlug: 'sacred-vibes-yoga', pageSize: 3 }),
    ])
    return {
      services: servicesRes.status === 'fulfilled' ? servicesRes.value.data?.data ?? [] : [],
      events: eventsRes.status === 'fulfilled' ? eventsRes.value.data?.data ?? [] : [],
      posts: postsRes.status === 'fulfilled' ? postsRes.value.data?.data?.items ?? [] : [],
    }
  } catch {
    return { services: [], events: [], posts: [] }
  }
}

export default async function YogaHomePage({ brand }: Props) {
  const { services, events, posts } = await getData()

  return (
    <>
      {/* Hero */}
      <HeroSection
        eyebrow="Welcome to Sacred Vibes Yoga"
        heading="Move. Breathe. Heal. Thrive."
        subheading="A holistic wellness sanctuary in Asheville, NC dedicated to nurturing body, mind, and spirit through yoga, sound healing, and therapeutic massage."
        primaryCta={{ label: 'Explore Classes', href: '/classes' }}
        secondaryCta={{ label: 'Our Story', href: '/about' }}
        colorScheme="yoga"
      />

      {/* Services preview */}
      {services.length > 0 && (
        <section className="section bg-white">
          <div className="container-sacred">
            <SectionHeading
              eyebrow="Practice With Us"
              heading="Yoga Classes & Services"
              subheading="From drop-in classes to private sessions, find the practice that meets you where you are."
              align="center"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {services.slice(0, 3).map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/classes" className="inline-flex items-center gap-2 text-yoga-700 hover:text-yoga-900 font-medium text-sm transition-colors">
                View all classes & services
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Upcoming events */}
      {events.length > 0 && (
        <section className="section bg-yoga-50">
          <div className="container-sacred">
            <SectionHeading
              eyebrow="Mark Your Calendar"
              heading="Upcoming Events & Workshops"
              subheading="Special gatherings, workshops, and immersive experiences to deepen your practice."
              align="center"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {events.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/events" className="inline-flex items-center gap-2 text-yoga-700 hover:text-yoga-900 font-medium text-sm transition-colors">
                See all events
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Sub-brands */}
      <section className="section bg-white">
        <div className="container-sacred">
          <SectionHeading
            eyebrow="The Sacred Vibes Family"
            heading="Our Healing Arts"
            subheading="Sacred Vibes Yoga is home to two dedicated healing arts practices, each with their own deep expertise."
            align="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <SubBrandCard
              name="Sacred Hands"
              tagline="Healing Through Touch"
              description="Transformative massage therapy to melt tension, restore balance, and return you to yourself. Our skilled therapists blend traditional techniques with intuitive healing touch."
              href="https://hands.sacredvibesyoga.com"
              ctaLabel="Explore Sacred Hands"
              colorScheme="hands"
              services={['Swedish Massage', 'Deep Tissue', 'Hot Stone', 'Prenatal', 'Craniosacral']}
            />
            <SubBrandCard
              name="Sacred Sound"
              tagline="Vibrate Higher"
              description="Vibrational healing through sound baths, singing bowls, gong immersions, and our signature Sound on the River experiences. Let the vibrations guide you inward."
              href="https://sound.sacredvibesyoga.com"
              ctaLabel="Explore Sacred Sound"
              colorScheme="sound"
              services={['Sound Baths', 'Private Sessions', 'Sound on the River', 'Workshops', 'Gong Immersions']}
            />
          </div>
        </div>
      </section>

      {/* Blog */}
      {posts.length > 0 && (
        <section className="section bg-sacred-50">
          <div className="container-sacred">
            <SectionHeading
              eyebrow="Wisdom & Practice"
              heading="From the Blog"
              subheading="Insights, reflections, and practical wisdom for your wellness journey."
              align="center"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/blog" className="inline-flex items-center gap-2 text-yoga-700 hover:text-yoga-900 font-medium text-sm">
                Read all posts
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <NewsletterSection brandId={getBrandIdBySlug('sacred-vibes-yoga')} />
    </>
  )
}
