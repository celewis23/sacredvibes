import Link from 'next/link'
import type { BrandContext } from '@/lib/brand/resolution'
import HeroSection from '@/components/sections/HeroSection'
import SectionHeading from '@/components/sections/SectionHeading'
import ServiceCard from '@/components/booking/ServiceCard'
import BlogCard from '@/components/blog/BlogCard'
import NewsletterSection from '@/components/sections/NewsletterSection'
import { getBrandIdBySlug, toBrandPath } from '@/lib/brand/resolution'
import { servicesApi, blogApi } from '@/lib/api'

interface Props { brand: BrandContext }

async function getData() {
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

export default async function HandsHomePage({ brand }: Props) {
  const { services, posts } = await getData()

  return (
    <>
      <HeroSection
        eyebrow="Sacred Hands Massage Therapy"
        heading="Healing Through Touch"
        subheading="Transformative massage therapy designed to melt tension, restore balance, and return you to yourself. Our skilled therapists blend traditional techniques with intuitive healing touch."
        primaryCta={{ label: 'Book a Session', href: toBrandPath(brand, '/booking') }}
        secondaryCta={{ label: 'Our Services', href: toBrandPath(brand, '/services') }}
        colorScheme="hands"
        imageUrl="/images/sacred-hands.jpg"
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
              />
              <ul className="mt-8 space-y-4 text-sacred-600 text-sm leading-relaxed">
                {[
                  'Nervous system regulation through skilled therapeutic touch',
                  'Release of held tension patterns in the body\'s tissues',
                  'Deep rest in a space free from expectation',
                  'Integration of mind, body, and spirit',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-hands-400 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-3xl border border-hands-100 p-8 shadow-soft">
              <p className="font-heading text-2xl text-hands-900 leading-snug mb-6">
                &ldquo;The body is the first teacher. When we learn to listen to it, healing becomes possible in ways we never imagined.&rdquo;
              </p>
              <p className="text-sm text-sacred-500">— Sacred Hands Practitioner</p>
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
}
