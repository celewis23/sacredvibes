import { headers } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getCurrentBrand } from '@/lib/brand/current'
import { blogApi } from '@/lib/api'

export const revalidate = 300

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)

  try {
    const res = await blogApi.getPost(slug, brand.slug)
    const post = res.data.data
    if (!post) return {}
    return {
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.excerpt,
      openGraph: {
        title: post.seoTitle ?? post.title,
        description: post.seoDescription ?? post.excerpt,
        images: post.featuredImage?.publicUrl ? [post.featuredImage.publicUrl] : [],
      },
    }
  } catch {
    return {}
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)

  let post
  try {
    const res = await blogApi.getPost(slug, brand.slug)
    post = res.data.data
  } catch {
    notFound()
  }

  if (!post) notFound()

  const featuredImageUrl = post.featuredImage?.variantsJson
    ? (() => { try { return JSON.parse(post.featuredImage.variantsJson!).large ?? post.featuredImage.publicUrl } catch { return post.featuredImage.publicUrl } })()
    : post.featuredImage?.publicUrl

  return (
    <main>
      {/* Hero */}
      <div className="relative">
        {featuredImageUrl ? (
          <div className="relative h-72 md:h-96 overflow-hidden">
            <Image
              src={featuredImageUrl}
              alt={post.featuredImage?.altText ?? post.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50" />
            <div className="absolute bottom-0 inset-x-0 p-8 md:p-12">
              <div className="container-sacred">
                {post.categoryNames.length > 0 && (
                  <p className="text-xs font-medium uppercase tracking-widest text-white/80 mb-3">
                    {post.categoryNames.join(' · ')}
                  </p>
                )}
                <h1 className="font-heading text-3xl md:text-5xl text-white max-w-3xl leading-tight">
                  {post.title}
                </h1>
              </div>
            </div>
          </div>
        ) : (
          <div className="section-sm bg-sacred-50">
            <div className="container-sacred">
              {post.categoryNames.length > 0 && (
                <p className="text-xs font-medium uppercase tracking-widest text-sacred-500 mb-3">
                  {post.categoryNames.join(' · ')}
                </p>
              )}
              <h1 className="font-heading text-3xl md:text-5xl text-sacred-900 max-w-3xl">
                {post.title}
              </h1>
            </div>
          </div>
        )}
      </div>

      {/* Meta bar */}
      <div className="border-b border-sacred-100">
        <div className="container-sacred py-4 flex flex-wrap items-center gap-4 text-sm text-sacred-500">
          <span>{post.authorName}</span>
          {post.publishedAt && (
            <>
              <span>&middot;</span>
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </time>
            </>
          )}
          {post.readingTimeMinutes && (
            <>
              <span>&middot;</span>
              <span>{post.readingTimeMinutes} min read</span>
            </>
          )}
          {post.tagNames.length > 0 && (
            <>
              <span>&middot;</span>
              <div className="flex flex-wrap gap-2">
                {post.tagNames.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-sacred-50 text-sacred-600 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="section">
        <div className="container-sacred">
          <div className="grid grid-cols-12 gap-8">
            <article className="col-span-12 lg:col-span-8">
              {post.excerpt && (
                <p className="text-lg text-sacred-600 leading-relaxed mb-8 font-light italic">
                  {post.excerpt}
                </p>
              )}
              <div
                className="prose-sacred"
                dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
              />
            </article>

            {/* Sidebar */}
            <aside className="col-span-12 lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="bg-sacred-50 rounded-2xl p-6">
                  <p className="text-xs font-medium uppercase tracking-widest text-sacred-500 mb-1">Written by</p>
                  <p className="font-heading text-xl text-sacred-900">{post.authorName}</p>
                </div>

                <div className="bg-white border border-sacred-100 rounded-2xl p-6">
                  <p className="font-heading text-lg text-sacred-900 mb-3">Stay Connected</p>
                  <p className="text-sm text-sacred-600 mb-4">
                    Receive updates, class schedules, and teachings from {brand.name}.
                  </p>
                  <Link
                    href="/contact"
                    className="block text-center px-5 py-2.5 bg-sacred-800 text-white text-sm rounded-full hover:bg-sacred-900 transition-colors"
                  >
                    Join the Community
                  </Link>
                </div>
              </div>
            </aside>
          </div>

          {/* Back link */}
          <div className="mt-12 pt-8 border-t border-sacred-100">
            <Link
              href="/blog"
              className="text-sm text-sacred-600 hover:text-sacred-900 transition-colors"
            >
              ← Back to Journal
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
