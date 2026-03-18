import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import type { BlogPostSummary } from '@/types'
import Card from '@/components/ui/card'

interface Props {
  post: BlogPostSummary
}

export default function BlogCard({ post }: Props) {
  const href = `/blog/${post.slug}`

  return (
    <Card hover padding="none" as="article" className="overflow-hidden flex flex-col">
      {post.featuredImage?.publicUrl && (
        <Link href={href} className="block overflow-hidden aspect-video relative">
          <Image
            src={post.featuredImage.publicUrl}
            alt={post.featuredImage.altText ?? post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        </Link>
      )}

      <div className="p-6 flex flex-col flex-1">
        {post.categoryNames.length > 0 && (
          <p className="text-xs font-semibold tracking-widest uppercase text-yoga-600 mb-2">
            {post.categoryNames[0]}
          </p>
        )}

        <Link href={href} className="group">
          <h3 className="font-heading text-xl text-sacred-900 leading-snug mb-3 group-hover:text-yoga-700 transition-colors">
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p className="text-sm text-sacred-600 leading-relaxed mb-4 flex-1 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-sacred-100 mt-auto">
          <div>
            <p className="text-xs font-medium text-sacred-700">{post.authorName}</p>
            {post.publishedAt && (
              <p className="text-xs text-sacred-400">
                {format(new Date(post.publishedAt), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <Link
            href={href}
            className="text-xs font-medium text-yoga-600 hover:text-yoga-800 transition-colors"
          >
            Read →
          </Link>
        </div>
      </div>
    </Card>
  )
}
