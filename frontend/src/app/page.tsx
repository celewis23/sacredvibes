import { headers } from 'next/headers'
import { resolveBrandFromHost } from '@/lib/brand/resolution'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import YogaHomePage from '@/components/site/YogaHomePage'
import HandsHomePage from '@/components/site/HandsHomePage'
import SoundHomePage from '@/components/site/SoundHomePage'

export default async function RootPage() {
  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const brand = resolveBrandFromHost(host)

  // Render correct home page based on brand
  const HomePage = {
    'sacred-vibes-yoga': YogaHomePage,
    'sacred-hands':      HandsHomePage,
    'sacred-sound':      SoundHomePage,
  }[brand.slug] ?? YogaHomePage

  return (
    <>
      <SiteHeader brand={brand} />
      <main>
        <HomePage brand={brand} />
      </main>
      <SiteFooter brand={brand} />
    </>
  )
}
