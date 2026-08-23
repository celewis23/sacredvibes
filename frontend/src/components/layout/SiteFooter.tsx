'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { resolveDisplayBrand, type BrandContext } from '@/lib/brand/resolution'
import LotusMark from '@/components/branding/LotusMark'
import { useSiteNavigation } from '@/components/layout/useSiteNavigation'
import { settingsApi } from '@/lib/api'
import type { SocialLinks } from '@/types'

interface SiteFooterProps {
  brand: BrandContext
}

const SOCIAL_ICONS: { key: keyof SocialLinks; name: string; icon: React.ReactNode }[] = [
  {
    key: 'instagram',
    name: 'Instagram',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    key: 'facebook',
    name: 'Facebook',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    key: 'youTube',
    name: 'YouTube',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
      </svg>
    ),
  },
  {
    key: 'tikTok',
    name: 'TikTok',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
  },
  {
    key: 'bioBox',
    name: 'BioBox',
    icon: (
      <svg width="18" height="18" viewBox="0 0 256 256" fill="none">
        <defs>
          <linearGradient id="footer-bb-top" x1="44" y1="34" x2="198" y2="182" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#C8FF1A"/>
            <stop offset="0.48" stopColor="#3DDC84"/>
            <stop offset="1" stopColor="#1CA4FF"/>
          </linearGradient>
          <linearGradient id="footer-bb-base" x1="36" y1="132" x2="198" y2="254" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#19A9FF"/>
            <stop offset="0.55" stopColor="#2C6DFF"/>
            <stop offset="1" stopColor="#5B2DFF"/>
          </linearGradient>
        </defs>
        <path d="M128 18L228 74C238 79 244 89 244 100V164C244 175 238 185 228 190L128 246L28 190C18 185 12 175 12 164V100C12 89 18 79 28 74L128 18Z" fill="url(#footer-bb-top)"/>
        <path d="M30 98L128 154L226 98V164C226 170 223 175 218 178L128 230L38 178C33 175 30 170 30 164V98Z" fill="url(#footer-bb-base)"/>
        <path d="M58 88C58 75 68 64 81 64H175C188 64 198 75 198 88V113C198 116 197 119 195 121L177 139C171 145 162 148 154 148H102C95 148 88 145 83 140L63 121C60 118 58 114 58 110V88Z" fill="white" fillOpacity="0.92"/>
        <path d="M54 101C54 87 66 76 80 76H96C106 76 114 84 114 94V112C114 118 112 124 108 128L90 146C85 151 78 154 71 154H56C44 154 34 144 34 132V119C34 113 36 107 41 103L54 91V101Z" fill="white"/>
        <circle cx="128" cy="86" r="24" fill="white"/>
        <path d="M128 118C105 118 86 133 78 154H178C170 133 151 118 128 118Z" fill="white"/>
      </svg>
    ),
  },
]

export default function SiteFooter({ brand }: SiteFooterProps) {
  const pathname = usePathname()
  const displayBrand = resolveDisplayBrand(brand, pathname)
  const { handleNavigationClick } = useSiteNavigation()
  const year = new Date().getFullYear()
  const isYoga = displayBrand.slug === 'sacred-vibes-yoga'

  const { data: socialLinks } = useQuery({
    queryKey: ['public-social-links'],
    queryFn: () => settingsApi.getSocialLinks().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  })

  const activeSocialIcons = SOCIAL_ICONS.filter(s => socialLinks?.[s.key])

  const brandDescription = {
    'sacred-vibes-yoga': 'Merging ancient sacred wellness practices with modern life — helping people regulate their nervous systems, reconnect to their true selves, and elevate their frequency.',
    'sacred-hands':      'Transformative massage therapy designed to melt tension, restore balance, and return you to yourself. Every touch carries intention.',
    'sacred-sound':      'A portal into vibrational healing through sound baths, singing bowls, gong immersions, and our signature Sound on the River experience.',
  }[displayBrand.slug]

  return (
    <footer className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1c1714 0%, #231a15 50%, #1c1714 100%)' }}>
      {/* Ambient orbs */}
      <div className="orb w-[500px] h-[500px] bg-yoga-700"
           style={{ top: '-100px', right: '-80px', opacity: 0.07 }} />
      <div className="orb w-[400px] h-[400px] bg-yoga-600"
           style={{ bottom: '-80px', left: '-60px', opacity: 0.05 }} />

      {/* Gold top border */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-yoga-600/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 relative z-10">

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 mb-16">

          {/* Brand column */}
          <div className="lg:col-span-5">
            <Link
              href="/"
              onClick={(event) => handleNavigationClick(event, '/')}
              className="inline-flex items-center gap-3 group mb-6"
            >
              <LotusMark
                className="w-12"
                gradientClassName="drop-shadow-[0_10px_24px_rgba(176,130,86,0.35)]"
              />
              <div>
                <p className="font-heading font-semibold text-white text-lg leading-tight">
                  Sacred Vibes
                </p>
                <p className="text-[9px] tracking-[0.22em] uppercase font-body font-medium text-yoga-400">
                  Healing &amp; Wellness
                </p>
              </div>
            </Link>

            <p className="text-sacred-400/80 text-sm font-body font-light leading-relaxed max-w-xs mb-6 tracking-wide">
              {brandDescription}
            </p>

            {activeSocialIcons.length > 0 && (
              <>
                <p className="eyebrow text-yoga-500/70 mb-4 text-[10px]">Follow the Journey</p>
                <div className="flex gap-3">
                  {activeSocialIcons.map((s) => (
                    <a
                      key={s.key}
                      href={socialLinks?.[s.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.name}
                      className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-yoga-700/30 hover:border-yoga-500/40 flex items-center justify-center text-sacred-400 hover:text-yoga-300 transition-all duration-300"
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="lg:col-span-3">
            <p className="eyebrow text-white/60 mb-6">Navigate</p>
            <ul className="space-y-3">
              {displayBrand.navLinks.slice(0, 7).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={(event) => handleNavigationClick(event, link.href)}
                    className="text-sm text-sacred-400/70 hover:text-yoga-300 transition-colors duration-200 font-body tracking-wide"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect + Sub-brands */}
          <div className="lg:col-span-4">
            <p className="eyebrow text-white/60 mb-6">Connect</p>
            <ul className="space-y-3 text-sm text-sacred-400/70 font-body tracking-wide mb-8">
              <li className="flex items-center gap-2">
                <span className="text-yoga-500 text-xs">📍</span>
                Richmond, Virginia
              </li>
              <li className="flex items-center gap-2">
                <span className="text-yoga-500 text-xs">✉️</span>
                <a href="mailto:hello@sacredvibesyoga.com" className="hover:text-yoga-300 transition-colors">
                  hello@sacredvibesyoga.com
                </a>
              </li>
            </ul>

            {isYoga && (
              <div>
                <p className="eyebrow text-white/60 mb-4">The Sacred Family</p>
                <ul className="space-y-3">
                  <li>
                    <Link href="/hands"
                       onClick={(event) => handleNavigationClick(event, '/hands')}
                       className="group inline-flex items-center gap-2 text-sm text-sacred-400/70 hover:text-yoga-300 transition-colors font-body tracking-wide">
                      Sacred Hands — Healing Touch
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-yoga-400">→</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/sound"
                       onClick={(event) => handleNavigationClick(event, '/sound')}
                       className="group inline-flex items-center gap-2 text-sm text-sacred-400/70 hover:text-yoga-300 transition-colors font-body tracking-wide">
                      Sacred Sound — Vibrational Healing
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-yoga-400">→</span>
                    </Link>
                  </li>
                </ul>
              </div>
            )}

            {!isYoga && (
              <div>
                <Link href="/"
                   onClick={(event) => handleNavigationClick(event, '/')}
                   className="group inline-flex items-center gap-2 text-sm text-sacred-400/70 hover:text-yoga-300 transition-colors font-body tracking-wide">
                  Sacred Vibes Healing & Wellness
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-yoga-400">→</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center py-10 border-y border-white/5">
          <p className="font-heading text-2xl md:text-3xl text-yoga-600/50 tracking-wide">
            Align. Restore. Elevate.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-sacred-500/60 font-body tracking-wide">
            &copy; {year} Sacred Vibes Healing & Wellness. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="text-xs text-sacred-500/60 hover:text-sacred-300 transition-colors font-body">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-sacred-500/60 hover:text-sacred-300 transition-colors font-body">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
