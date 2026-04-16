import { headers } from 'next/headers'
import EditablePageSections from '@/components/page-editor/EditablePageSections'
import { getCurrentBrand } from '@/lib/brand/current'
import { getPublicPageBySlug } from '@/lib/api'
import YogaHomePage from '@/components/site/YogaHomePage'
import HandsHomePage from '@/components/site/HandsHomePage'
import SoundHomePage from '@/components/site/SoundHomePage'

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)
  const query = await searchParams

  if (query.edit === '1') {
    const page = await getPublicPageBySlug('home', brand.slug)
    if (page) {
      if (brand.slug === 'sacred-hands') {
        return (
          <main>
            <HandsHomePage brand={brand} editablePage={page} />
          </main>
        )
      }

      if (brand.slug === 'sacred-sound') {
        return (
          <main>
            <SoundHomePage brand={brand} editablePage={page} />
          </main>
        )
      }

      return (
        <main>
          <EditablePageSections page={page} />
        </main>
      )
    }
  }

  // Render correct home page based on brand
  const HomePage = {
    'sacred-vibes-yoga': YogaHomePage,
    'sacred-hands':      HandsHomePage,
    'sacred-sound':      SoundHomePage,
  }[brand.slug] ?? YogaHomePage

  return (
    <main>
      <HomePage brand={brand} />
    </main>
  )
}
