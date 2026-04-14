'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { clsx } from 'clsx'
import { toBrandPath, type BrandContext } from '@/lib/brand/resolution'
import LotusMark from '@/components/branding/LotusMark'

interface SiteHeaderProps {
  brand: BrandContext
}

const subBrandSchemes = {
  yoga:  { ctaGradient: 'from-yoga-700 to-yoga-500',  hoverText: 'hover:text-yoga-600',  activeBg: 'hover:bg-yoga-50' },
  hands: { ctaGradient: 'from-hands-700 to-hands-500', hoverText: 'hover:text-hands-600', activeBg: 'hover:bg-hands-50' },
  sound: { ctaGradient: 'from-sound-700 to-sound-500', hoverText: 'hover:text-sound-600', activeBg: 'hover:bg-sound-50' },
}

export default function SiteHeader({ brand }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [onDark, setOnDark] = useState(false)
  const [canHover, setCanHover] = useState(false)
  const [openDesktopMenu, setOpenDesktopMenu] = useState<string | null>(null)
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null)
  const scheme = subBrandSchemes[brand.colorScheme]
  const pathname = usePathname()
  const router = useRouter()
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Reset open state on navigation
    setIsOpen(false)
    setOpenDesktopMenu(null)
    setOpenMobileMenu(null)
  }, [pathname])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover)')
    const updateHoverCapability = () => setCanHover(mediaQuery.matches)

    updateHoverCapability()
    mediaQuery.addEventListener('change', updateHoverCapability)
    return () => mediaQuery.removeEventListener('change', updateHoverCapability)
  }, [])

  useEffect(() => {
    const HEADER_MID_Y = 48 // vertical centre of the 96px header

    function detect() {
      // Find any section marked data-header="dark" that currently covers the
      // vertical midpoint of the header. Default to light if none found.
      const darkSections = document.querySelectorAll<HTMLElement>('[data-header="dark"]')
      let foundDark = false
      for (const el of darkSections) {
        const { top, bottom } = el.getBoundingClientRect()
        if (top <= HEADER_MID_Y && bottom > HEADER_MID_Y) {
          foundDark = true
          break
        }
      }
      setOnDark(foundDark)
    }

    function onScroll() {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(detect)
    }

    detect() // run immediately on mount / navigation
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', detect, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', detect)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [pathname]) // re-run the observer whenever the page changes

  const isYoga = brand.slug === 'sacred-vibes-yoga'

  function navigateTo(href: string) {
    setOpenDesktopMenu(null)
    setOpenMobileMenu(null)
    setIsOpen(false)
    router.push(href)
  }

  return (
    <header className={clsx(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
      onDark
        ? 'bg-transparent'
        : 'bg-white/96 backdrop-blur-2xl shadow-soft border-b border-sacred-100/80'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24">

          {/* Logo */}
          <Link href={toBrandPath(brand, '/')} className="flex items-center gap-3 group flex-shrink-0">
            <LotusMark
              className="w-12 transition-all duration-300 group-hover:scale-105"
              gradientClassName="drop-shadow-[0_10px_24px_rgba(176,130,86,0.35)]"
            />
            <div className="block min-w-0">
              <p className={clsx(
                'font-heading font-semibold leading-tight tracking-wide transition-colors duration-300 text-base sm:text-lg',
                onDark ? 'text-white' : 'text-sacred-900'
              )}>
                Sacred Vibes
              </p>
              <p className={clsx(
                'text-[8px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.22em] uppercase font-body font-medium transition-colors duration-300',
                onDark ? 'text-yoga-300' : 'text-yoga-600'
              )}>
                Healing &amp; Wellness
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {brand.navLinks.map((link) => (
              <div
                key={link.href}
                className="relative pb-2 -mb-2"
                onMouseEnter={() => {
                  if (link.children && canHover) setOpenDesktopMenu(link.href)
                }}
                onMouseLeave={() => {
                  if (link.children && canHover) setOpenDesktopMenu((current) => current === link.href ? null : current)
                }}
              >
                {link.children ? (
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={openDesktopMenu === link.href}
                    onClick={() => setOpenDesktopMenu((current) => current === link.href ? null : link.href)}
                    className={clsx(
                      'flex items-center gap-1 px-4 py-2.5 rounded-full text-sm font-body font-medium tracking-wide transition-all duration-200',
                      onDark
                        ? 'text-white/85 hover:text-white hover:bg-white/10'
                        : `text-sacred-700 ${scheme.hoverText} ${scheme.activeBg}`
                    )}
                  >
                    {link.label}
                    <svg className={clsx('w-3 h-3 opacity-50 transition-transform', openDesktopMenu === link.href && 'rotate-180')} viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 8L2 4h8z"/>
                    </svg>
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className={clsx(
                      'flex items-center gap-1 px-4 py-2.5 rounded-full text-sm font-body font-medium tracking-wide transition-all duration-200',
                      onDark
                        ? 'text-white/85 hover:text-white hover:bg-white/10'
                        : `text-sacred-700 ${scheme.hoverText} ${scheme.activeBg}`
                    )}
                  >
                    {link.label}
                  </Link>
                )}

                {link.children && openDesktopMenu === link.href && (
                  <div className="absolute top-full left-0 w-56 pt-2">
                    <div className={clsx(
                      'rounded-2xl border shadow-luxury',
                      'bg-white border-sacred-100/80 overflow-hidden opacity-100 visible translate-y-0'
                    )}>
                      {link.children.map((child) => (
                        <button
                          key={child.href}
                          type="button"
                          onClick={() => navigateTo(child.href)}
                          className="block w-full text-left px-5 py-3.5 text-sm text-sacred-700 hover:text-yoga-700 hover:bg-yoga-50/70 transition-colors border-b border-sacred-50 last:border-0"
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            {!isYoga && (
              <Link
                href={toBrandPath(brand, '/contact')}
                className={clsx(
                  'px-5 py-2.5 rounded-full text-sm font-body font-medium tracking-wide border transition-all duration-300',
                  onDark
                    ? 'border-white/30 text-white/80 hover:border-white/60 hover:text-white'
                    : 'border-sacred-300 text-sacred-700 hover:border-yoga-400 hover:text-yoga-700'
                )}
              >
                Contact
              </Link>
            )}
            <Link
              href={toBrandPath(brand, '/booking')}
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
              onDark ? 'text-white hover:bg-white/10' : 'text-sacred-700 hover:bg-sacred-100'
            )}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu — always opaque regardless of background */}
      {isOpen && (
        <div className="lg:hidden border-t border-white/10 bg-sacred-950/96 backdrop-blur-2xl animate-slide-down">
          <nav className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-1">
            {brand.navLinks.map((link) => (
              <div key={link.href}>
                {link.children ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setOpenMobileMenu((current) => current === link.href ? null : link.href)}
                      className={clsx(
                        'w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-colors',
                        'text-white/90 hover:text-white hover:bg-white/10'
                      )}
                    >
                      <span>{link.label}</span>
                      <svg className={clsx('w-3 h-3 opacity-50 transition-transform', openMobileMenu === link.href && 'rotate-180')} viewBox="0 0 12 12" fill="currentColor">
                        <path d="M6 8L2 4h8z"/>
                      </svg>
                    </button>
                    {openMobileMenu === link.href && link.children.map((child) => (
                      <button
                        key={child.href}
                        type="button"
                        onClick={() => navigateTo(child.href)}
                        className="block w-full text-left px-8 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-colors"
                      >
                        {child.label}
                      </button>
                    ))}
                  </>
                ) : (
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={clsx(
                      'block px-4 py-3 rounded-2xl text-sm font-medium transition-colors',
                      'text-white/90 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
            <div className="pt-4 mt-2 border-t border-white/10 flex flex-col gap-3">
              <Link
                href={toBrandPath(brand, '/booking')}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'block text-center px-6 py-3.5 rounded-full text-sm font-medium tracking-[0.1em] uppercase',
                  `bg-gradient-to-r ${scheme.ctaGradient} text-white shadow-glow`
                )}
              >
                Book Now
              </Link>
              <Link
                href={toBrandPath(brand, '/contact')}
                onClick={() => setIsOpen(false)}
                className="block text-center px-6 py-3 rounded-full text-sm font-medium border border-white/25 text-white/90 hover:border-white/45 hover:text-white"
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
