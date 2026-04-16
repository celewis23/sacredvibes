'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { resolveDisplayBrand, type BrandContext } from '@/lib/brand/resolution'
import LotusMark from '@/components/branding/LotusMark'
import { useSiteNavigation } from '@/components/layout/useSiteNavigation'

interface SiteFooterProps {
  brand: BrandContext
}

const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    name: 'Facebook',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: '#',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
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

            <p className="eyebrow text-yoga-500/70 mb-4 text-[10px]">Follow the Journey</p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-yoga-700/30 hover:border-yoga-500/40 flex items-center justify-center text-sacred-400 hover:text-yoga-300 transition-all duration-300"
                >
                  {s.icon}
                </a>
              ))}
            </div>
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
