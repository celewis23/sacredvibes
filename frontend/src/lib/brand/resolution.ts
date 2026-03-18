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
    name: 'Sacred Vibes Yoga',
    subdomain: 'sacredvibesyoga.com',
    isAdmin: false,
    colorScheme: 'yoga',
    navLinks: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      {
        label: 'Yoga',
        href: '/classes',
        children: [
          { label: 'Classes', href: '/classes' },
          { label: 'Workshops', href: '/workshops' },
          { label: 'Events', href: '/events' },
        ],
      },
      { label: 'Sacred Hands', href: 'https://hands.sacredvibesyoga.com' },
      { label: 'Sacred Sound', href: 'https://sound.sacredvibesyoga.com' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  'hands.sacredvibesyoga.com': {
    id: BRAND_IDS['sacred-hands'],
    slug: 'sacred-hands',
    name: 'Sacred Hands',
    subdomain: 'hands.sacredvibesyoga.com',
    isAdmin: false,
    colorScheme: 'hands',
    navLinks: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'Book Now', href: '/booking' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  'sound.sacredvibesyoga.com': {
    id: BRAND_IDS['sacred-sound'],
    slug: 'sacred-sound',
    name: 'Sacred Sound',
    subdomain: 'sound.sacredvibesyoga.com',
    isAdmin: false,
    colorScheme: 'sound',
    navLinks: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Sound Healing', href: '/sound-healing' },
      { label: 'Workshops', href: '/workshops' },
      { label: 'Sound on the River', href: '/sound-on-the-river' },
      { label: 'Events', href: '/events' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
  },
}

export function resolveBrandFromHost(host: string): BrandContext {
  const normalized = host.replace(/:\d+$/, '').toLowerCase()

  if (BRAND_CONFIGS[normalized]) return BRAND_CONFIGS[normalized]

  if (normalized.includes('localhost') || normalized.includes('127.0.0.1')) {
    return BRAND_CONFIGS['sacredvibesyoga.com']
  }

  return BRAND_CONFIGS['sacredvibesyoga.com']
}

export function getBrandConfigBySlug(slug: BrandSlug): BrandContext {
  const entry = Object.values(BRAND_CONFIGS).find(b => b.slug === slug)
  return entry ?? BRAND_CONFIGS['sacredvibesyoga.com']
}

export function getBrandIdBySlug(slug: BrandSlug): string {
  return BRAND_IDS[slug]
}

export function formatPrice(price: number | undefined, priceType: string, currency = 'USD'): string {
  if (!price && priceType !== 'Free') return 'Contact for pricing'
  if (priceType === 'Free') return 'Free'
  if (priceType === 'Donation') return 'Donation-based'
  if (priceType === 'SlidingScale') return 'Sliding scale'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price ?? 0)
}
