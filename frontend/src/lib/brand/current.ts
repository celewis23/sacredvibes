import { getBrandConfigBySlug, resolveBrandFromHost } from '@/lib/brand/resolution'
import type { BrandSlug } from '@/types'

interface HeaderLike {
  get(name: string): string | null
}

export function getCurrentBrand(headersList: HeaderLike) {
  const brandSlug = headersList.get('x-brand') as BrandSlug | null

  if (brandSlug === 'sacred-vibes-yoga' || brandSlug === 'sacred-hands' || brandSlug === 'sacred-sound') {
    return getBrandConfigBySlug(brandSlug)
  }

  return resolveBrandFromHost(headersList.get('host') ?? '')
}
