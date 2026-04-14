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

const LOCAL_DEV_PORT = '3000'
const LOCAL_HOSTS: Record<string, string> = {
  'sacredvibesyoga.local':        'sacredvibesyoga.com',
  'hands.sacredvibesyoga.local':  'hands.sacredvibesyoga.com',
  'sound.sacredvibesyoga.local':  'sound.sacredvibesyoga.com',
  'admin.sacredvibesyoga.local':  'admin.sacredvibesyoga.com',
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
          { label: 'Sound Healing',      href: 'https://sound.sacredvibesyoga.com' },
          { label: 'Sacred Hands',       href: 'https://hands.sacredvibesyoga.com' },
          { label: 'Corporate Wellness', href: '/contact' },
        ],
      },
      { label: 'Events',         href: '/events' },
      { label: 'About',          href: '/about' },
      { label: 'Digital Studio', href: '/digital-studio' },
      { label: 'Blog',           href: '/blog' },
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
      { label: 'Home',     href: '/' },
      { label: 'About',    href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'Book Now', href: '/booking' },
      { label: 'Gallery',  href: '/gallery' },
      { label: 'Blog',     href: '/blog' },
      { label: 'Contact',  href: '/contact' },
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
      { label: 'Home',               href: '/' },
      { label: 'About',              href: '/about' },
      { label: 'Sound Healing',      href: '/sound-healing' },
      { label: 'Workshops',          href: '/workshops' },
      { label: 'Sound on the River', href: '/sound-on-the-river' },
      { label: 'Events',             href: '/events' },
      { label: 'Gallery',            href: '/gallery' },
      { label: 'Blog',               href: '/blog' },
      { label: 'Contact',            href: '/contact' },
    ],
  },
}

export function resolveBrandFromHost(host: string): BrandContext {
  const normalized = host.replace(/:\d+$/, '').toLowerCase()
  const canonicalHost = LOCAL_HOSTS[normalized] ?? normalized

  if (BRAND_CONFIGS[canonicalHost]) {
    return withLocalDevLinks(BRAND_CONFIGS[canonicalHost], normalized)
  }

  if (normalized.includes('localhost') || normalized.includes('127.0.0.1')) {
    return withLocalDevLinks(BRAND_CONFIGS['sacredvibesyoga.com'], normalized)
  }

  return withLocalDevLinks(BRAND_CONFIGS['sacredvibesyoga.com'], normalized)
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

function withLocalDevLinks(brand: BrandContext, normalizedHost: string): BrandContext {
  if (!isLocalDevHost(normalizedHost)) return brand

  const navLinks = brand.navLinks.map((link) => {
    if (link.href === 'https://hands.sacredvibesyoga.com')
      return { ...link, href: `http://hands.sacredvibesyoga.local:${LOCAL_DEV_PORT}` }
    if (link.href === 'https://sound.sacredvibesyoga.com')
      return { ...link, href: `http://sound.sacredvibesyoga.local:${LOCAL_DEV_PORT}` }
    const children = link.children?.map((child) => {
      if (child.href === 'https://hands.sacredvibesyoga.com')
        return { ...child, href: `http://hands.sacredvibesyoga.local:${LOCAL_DEV_PORT}` }
      if (child.href === 'https://sound.sacredvibesyoga.com')
        return { ...child, href: `http://sound.sacredvibesyoga.local:${LOCAL_DEV_PORT}` }
      return child
    })
    return children ? { ...link, children } : link
  })

  return { ...brand, navLinks }
}

function isLocalDevHost(host: string): boolean {
  return host.includes('localhost')
    || host.includes('127.0.0.1')
    || host.endsWith('.local')
}
