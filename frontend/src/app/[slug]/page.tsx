import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import EditablePageSections from '@/components/page-editor/EditablePageSections'
import { getPublicPageBySlug } from '@/lib/api'
import { getCurrentBrand } from '@/lib/brand/current'

export default async function CmsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)
  const page = await getPublicPageBySlug(slug, brand.slug)

  if (!page) {
    notFound()
  }

  return (
    <main>
      <EditablePageSections page={page} />
    </main>
  )
}
