import { headers } from 'next/headers'
import { getCurrentBrand } from '@/lib/brand/current'
import YogaHomePage from '@/components/site/YogaHomePage'
import HandsHomePage from '@/components/site/HandsHomePage'
import SoundHomePage from '@/components/site/SoundHomePage'

export default async function RootPage() {
  const headersList = await headers()
  const brand = getCurrentBrand(headersList)

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
