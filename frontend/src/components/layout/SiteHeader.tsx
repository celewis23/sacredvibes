'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { clsx } from 'clsx'
import type { BrandContext } from '@/lib/brand/resolution'

interface SiteHeaderProps {
  brand: BrandContext
  heroMode?: boolean
}

const subBrandSchemes = {
  yoga:  { ctaGradient: 'from-yoga-700 to-yoga-500',  text: 'text-sacred-800', hoverText: 'hover:text-yoga-600',  activeBg: 'hover:bg-yoga-50' },
  hands: { ctaGradient: 'from-hands-700 to-hands-500', text: 'text-sacred-800', hoverText: 'hover:text-hands-600', activeBg: 'hover:bg-hands-50' },
  sound: { ctaGradient: 'from-sound-700 to-sound-500', text: 'text-sacred-800', hoverText: 'hover:text-sound-600', activeBg: 'hover:bg-sound-50' },
}

export default function SiteHeader({ brand, heroMode: heroModeProp = false }: SiteHeaderProps) {
  const [isOpen, setIsOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const scheme = subBrandSchemes[brand.colorScheme]

  // Use client-side pathname so this stays correct during client-side navigation.
  // The server prop heroModeProp is only a hint for the initial render.
  const pathname = usePathname()
  const isHeroPage = pathname === '/'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Only go transparent on the homepage hero; everywhere else stay opaque with dark text
  const isOpaque = !isHeroPage || scrolled

  const isYoga = brand.slug === 'sacred-vibes-yoga'

  return (
    <header className={clsx(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
      isOpaque
        ? 'bg-white/96 backdrop-blur-2xl shadow-soft border-b border-sacred-100/80'
        : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className={clsx(
              'w-11 h-11 rounded-2xl flex items-center justify-center',
              'bg-gradient-to-br from-yoga-500 to-yoga-800 text-white text-xl',
              'shadow-glow group-hover:shadow-gold transition-all duration-400 group-hover:scale-105'
            )}>
              ✦
            </div>
            <div className="hidden sm:block">
              <p className={clsx(
                'font-heading font-semibold text-lg leading-tight tracking-wide transition-colors duration-300',
                isOpaque ? 'text-sacred-900' : 'text-white'
              )}>
                Sacred Vibes
              </p>
              <p className={clsx(
                'text-[9px] tracking-[0.22em] uppercase font-body font-medium transition-colors duration-300',
                isOpaque ? 'text-yoga-600' : 'text-yoga-300'
              )}>
                Healing &amp; Wellness
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {brand.navLinks.map((link) => (
              <div key={link.href} className="relative group">
                <Link
                  href={link.href}
                  className={clsx(
                    'flex items-center gap-1 px-4 py-2.5 rounded-full text-sm font-body font-medium tracking-wide transition-all duration-200',
                    isOpaque
                      ? `text-sacred-700 ${scheme.hoverText} ${scheme.activeBg}`
                      : 'text-white/85 hover:text-white hover:bg-white/10'
                  )}
                >
                  {link.label}
                  {link.children && (
                    <svg className="w-3 h-3 opacity-50" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 8L2 4h8z"/>
                    </svg>
                  )}
                </Link>

                {link.children && (
                  <div className={clsx(
                    'absolute top-full left-0 mt-2 w-56 rounded-2xl border shadow-luxury',
                    'opacity-0 invisible translate-y-1',
                    'group-hover:opacity-100 group-hover:visible group-hover:translate-y-0',
                    'transition-all duration-300 bg-white border-sacred-100/80 overflow-hidden'
                  )}>
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-5 py-3.5 text-sm text-sacred-700 hover:text-yoga-700 hover:bg-yoga-50/70 transition-colors border-b border-sacred-50 last:border-0"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            {!isYoga && (
              <Link
                href="/contact"
                className={clsx(
                  'px-5 py-2.5 rounded-full text-sm font-body font-medium tracking-wide border transition-all duration-300',
                  isOpaque
                    ? 'border-sacred-300 text-sacred-700 hover:border-yoga-400 hover:text-yoga-700'
                    : 'border-white/30 text-white/80 hover:border-white/60 hover:text-white'
                )}
              >
                Contact
              </Link>
            )}
            <Link
              href="/booking"
              className={clsx(
                'px-7 py-2.5 rounded-full text-sm font-body font-medium tracking-[0.1em] uppercase',
                `bg-gradient-to-r ${scheme.ctaGradient} text-white`,
                'shadow-glow hover:shadow-gold hover:scale-[1.02] transition-all duration-300'
              )}
            >
              Book Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={clsx(
              'lg:hidden p-2.5 rounded-xl transition-colors',
              isOpaque ? 'text-sacred-700 hover:bg-sacred-100' : 'text-white hover:bg-white/10'
            )}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-sacred-100/80 bg-white/98 backdrop-blur-2xl animate-slide-down">
          <nav className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-1">
            {brand.navLinks.map((link) => (
              <div key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={clsx(
                    'block px-4 py-3 rounded-2xl text-sm font-medium transition-colors',
                    `text-sacred-800 ${scheme.hoverText} ${scheme.activeBg}`
                  )}
                >
                  {link.label}
                </Link>
                {link.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setIsOpen(false)}
                    className="block px-8 py-2.5 text-sm text-sacred-500 hover:text-yoga-700 hover:bg-yoga-50 rounded-2xl transition-colors"
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}
            <div className="pt-4 mt-2 border-t border-sacred-100 flex flex-col gap-3">
              <Link
                href="/booking"
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'block text-center px-6 py-3.5 rounded-full text-sm font-medium tracking-[0.1em] uppercase',
                  `bg-gradient-to-r ${scheme.ctaGradient} text-white shadow-glow`
                )}
              >
                Book Now
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="block text-center px-6 py-3 rounded-full text-sm font-medium border border-sacred-200 text-sacred-700 hover:border-yoga-300"
              >
                Contact
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
