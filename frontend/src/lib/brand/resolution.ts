import type { BrandSlug } from '@/types'

export interface BrandContext {
  id: string
  slug: BrandSlug
  name: string
  subdomain: string
  isAdmin: boolean
  colorScheme: 'yoga' | 'hands' | 'sound'
  navLinks: NavLink[]
}

export interface NavLink {
  label: string
  href: string
  children?: NavLink[]
}

const BRAND_BASE_PATHS: Record<BrandSlug, string> = {
  'sacred-vibes-yoga': '',
  'sacred-hands': '/hands',
  'sacred-sound': '/sound',
}

const LOCAL_HOSTS: Record<string, string> = {
  'sacredvibesyoga.local': 'sacredvibesyoga.com',
  'admin.sacredvibesyoga.local': 'admin.sacredvibesyoga.com',
}

// Well-known GUIDs must match SeedData.cs WellKnownIds
const BRAND_IDS: Record<BrandSlug, string> = {
  'sacred-vibes-yoga': '11111111-1111-1111-1111-111111111111',
  'sacred-hands':      '22222222-2222-2222-2222-222222222222',
  'sacred-sound':      '33333333-3333-3333-3333-333333333333',
}

export const BRAND_CONFIGS: Record<string, BrandContext> = {
  'sacredvibesyoga.com': {
    id: BRAND_IDS['sacred-vibes-yoga'],
    slug: 'sacred-vibes-yoga',
    name: 'Sacred Vibes Healing & Wellness',
    subdomain: 'sacredvibesyoga.com',
    isAdmin: false,
    colorScheme: 'yoga',
    navLinks: [
      { label: 'Home',           href: '/' },
      {
        label: 'Experiences',
        href: '/classes',
        children: [
          { label: 'Yoga & Movement',    href: '/classes' },
          { label: 'Sound Healing',      href: '/sound' },
          { label: 'Sacred Hands',       href: '/hands' },
          { label: 'Corporate Wellness', href: '/corporate-wellness' },
        ],
      },
      { label: 'Events',         href: '/events' },
      { label: 'About',          href: '/about' },
      { label: 'Digital Studio', href: '/digital-studio' },
      { label: 'Blog',           href: '/blog' },
      { label: 'Contact',        href: '/contact' },
    ],
  },
  'sacred-hands': {
    id: BRAND_IDS['sacred-hands'],
    slug: 'sacred-hands',
    name: 'Sacred Hands',
    subdomain: 'sacredvibesyoga.com',
    isAdmin: false,
    colorScheme: 'hands',
    navLinks: [
      { label: 'Home',     href: '/hands' },
      { label: 'About',    href: '/hands/about' },
      { label: 'Services', href: '/hands/services' },
      { label: 'Book Now', href: '/hands/booking' },
      { label: 'Gallery',  href: '/hands/gallery' },
      { label: 'Blog',     href: '/hands/blog' },
      { label: 'Contact',  href: '/hands/contact' },
    ],
  },
  'sacred-sound': {
    id: BRAND_IDS['sacred-sound'],
    slug: 'sacred-sound',
    name: 'Sacred Sound',
    subdomain: 'sacredvibesyoga.com',
    isAdmin: false,
    colorScheme: 'sound',
    navLinks: [
      { label: 'Home',               href: '/sound' },
      { label: 'About',              href: '/sound/about' },
      { label: 'Sound Healing',      href: '/sound' },
      { label: 'Workshops',          href: '/sound/events' },
      { label: 'Sound on the River', href: '/sound/sound-on-the-river' },
      { label: 'Events',             href: '/sound/events' },
      { label: 'Gallery',            href: '/sound/gallery' },
      { label: 'Blog',               href: '/sound/blog' },
      { label: 'Contact',            href: '/sound/contact' },
    ],
  },
}

export function resolveBrandFromHost(host: string): BrandContext {
  const normalized = host.replace(/:\d+$/, '').toLowerCase()
  const canonicalHost = LOCAL_HOSTS[normalized] ?? normalized
  return BRAND_CONFIGS[canonicalHost] ?? BRAND_CONFIGS['sacredvibesyoga.com']
}

export function getBrandConfigBySlug(slug: BrandSlug): BrandContext {
  const entry = Object.values(BRAND_CONFIGS).find(b => b.slug === slug)
  return entry ?? BRAND_CONFIGS['sacredvibesyoga.com']
}

export function getBrandIdBySlug(slug: BrandSlug): string {
  return BRAND_IDS[slug]
}

export function getBrandBasePath(brand: BrandContext | BrandSlug): string {
  const slug = typeof brand === 'string' ? brand : brand.slug
  return BRAND_BASE_PATHS[slug]
}

export function getBrandSlugFromPathname(pathname: string): BrandSlug | null {
  if (pathname === '/hands' || pathname.startsWith('/hands/')) return 'sacred-hands'
  if (pathname === '/sound' || pathname.startsWith('/sound/')) return 'sacred-sound'
  return null
}

export function stripBrandPrefix(pathname: string): {
  brandSlug: BrandSlug | null
  internalPathname: string
} {
  const brandSlug = getBrandSlugFromPathname(pathname)

  if (!brandSlug) {
    return { brandSlug: null, internalPathname: pathname }
  }

  const basePath = getBrandBasePath(brandSlug)
  const strippedPath = pathname.slice(basePath.length)
  return {
    brandSlug,
    internalPathname: strippedPath === '' ? '/' : strippedPath,
  }
}

export function toBrandPath(brand: BrandContext | BrandSlug, href: string): string {
  if (!href) return getBrandBasePath(brand) || '/'
  if (/^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
    return href
  }
  if (!href.startsWith('/')) return href
  if (href.startsWith('/admin')) return href
  if (href.startsWith('/hands') || href.startsWith('/sound')) return href

  const basePath = getBrandBasePath(brand)
  if (!basePath) return href
  return href === '/' ? basePath : `${basePath}${href}`
}

export function formatPrice(price: number | undefined, priceType: string, currency = 'USD'): string {
  if (!price && priceType !== 'Free') return 'Contact for pricing'
  if (priceType === 'Free') return 'Free'
  if (priceType === 'Donation') return 'Donation-based'
  if (priceType === 'SlidingScale') return 'Sliding scale'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price ?? 0)
}
