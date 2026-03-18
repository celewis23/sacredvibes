import { headers } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { getCurrentBrand } from '@/lib/brand/current'
import { blogApi } from '@/lib/api'
import type { BlogPostSummary } from '@/types'

export const revalidate = 300

async function getVariantUrl(post: BlogPostSummary): Promise<string> {
  return post.featuredImage?.variantsJson
    ? (() => { try { return JSON.parse(post.featuredImage!.variantsJson!).medium ?? post.featuredImage!.publicUrl ?? '' } catch { return post.featuredImage!.publicUrl ?? '' } })()
    : ''
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>
}) {
  const sp = await searchParams
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)

  const page = parseInt(sp.page ?? '1', 10)
  const category = sp.category

  let posts: BlogPostSummary[] = []
  let totalPages = 1

  try {
    const res = await blogApi.getPosts({
      brandSlug: brand.slug,
      category,
      page,
      pageSize: 9,
    })
    posts = res.data.data?.items ?? []
    totalPages = res.data.data?.totalPages ?? 1
  } catch { /* show empty state */ }

  const heroPost = posts[0]
  const restPosts = posts.slice(1)

  return (
    <main className="section">
      <div className="container-sacred">
        <div className="mb-12">
          <h1 className="font-heading text-4xl md:text-5xl text-sacred-900 mb-3">Journal</h1>
          <p className="text-sacred-600 text-lg">
            Insights, teachings, and stories from {brand.name}.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-sacred-400">
            <p className="font-heading text-2xl mb-2">No posts yet</p>
            <p className="text-sm">Check back soon — stories are on the way.</p>
          </div>
        ) : (
          <>
            {/* Hero post */}
            {heroPost && (
              <Link
                href={`/blog/${heroPost.slug}`}
                className="group block mb-12 rounded-2xl overflow-hidden border border-sacred-100 hover:shadow-card transition-shadow"
              >
                <div className="grid md:grid-cols-2">
                  <div className="relative aspect-[4/3] md:aspect-auto bg-sacred-100">
                    {heroPost.featuredImage && (
                      <Image
                        src={getVariantUrl(heroPost) as unknown as string}
                        alt={heroPost.featuredImage.altText ?? heroPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    )}
                  </div>
                  <div className="p-8 md:p-10 flex flex-col justify-center bg-white">
                    {heroPost.categoryNames.length > 0 && (
                      <p className="text-xs font-medium uppercase tracking-widest text-sacred-500 mb-3">
                        {heroPost.categoryNames[0]}
                      </p>
                    )}
                    <h2 className="font-heading text-2xl md:text-3xl text-sacred-900 mb-3 group-hover:text-sacred-700 transition-colors">
                      {heroPost.title}
                    </h2>
                    {heroPost.excerpt && (
                      <p className="text-sacred-600 leading-relaxed mb-4 line-clamp-3">{heroPost.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-sacred-400">
                      <span>{heroPost.authorName}</span>
                      <span>&middot;</span>
                      <span>
                        {heroPost.publishedAt
                          ? new Date(heroPost.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                          : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Post grid */}
            {restPosts.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
                {restPosts.map(post => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group block rounded-2xl overflow-hidden border border-sacred-100 hover:shadow-card transition-shadow bg-white"
                  >
                    {post.featuredImage && (
                      <div className="relative aspect-[16/9] bg-sacred-100 overflow-hidden">
                        <Image
                          src={getVariantUrl(post) as unknown as string}
                          alt={post.featuredImage.altText ?? post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      {post.categoryNames.length > 0 && (
                        <p className="text-xs font-medium uppercase tracking-widest text-sacred-500 mb-2">
                          {post.categoryNames[0]}
                        </p>
                      )}
                      <h3 className="font-heading text-xl text-sacred-900 mb-2 group-hover:text-sacred-700 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sacred-600 text-sm leading-relaxed line-clamp-2 mb-3">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-sacred-400">
                        <span>{post.authorName}</span>
                        <span>&middot;</span>
                        <span>
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : ''}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                {page > 1 && (
                  <Link
                    href={`/blog?page=${page - 1}${category ? `&category=${category}` : ''}`}
                    className="px-5 py-2 border border-sacred-200 rounded-full text-sm text-sacred-700 hover:bg-sacred-50 transition-colors"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-sm text-sacred-400">Page {page} of {totalPages}</span>
                {page < totalPages && (
                  <Link
                    href={`/blog?page=${page + 1}${category ? `&category=${category}` : ''}`}
                    className="px-5 py-2 border border-sacred-200 rounded-full text-sm text-sacred-700 hover:bg-sacred-50 transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
