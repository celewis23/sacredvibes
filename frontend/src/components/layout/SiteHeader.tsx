'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { clsx } from 'clsx'
import type { BrandContext } from '@/lib/brand/resolution'

interface SiteHeaderProps {
  brand: BrandContext
}

const colorSchemes = {
  yoga:  { bg: 'bg-yoga-50/95',   text: 'text-yoga-800',  accent: 'text-yoga-600',  border: 'border-yoga-100',  hover: 'hover:text-yoga-600',  activeBg: 'bg-yoga-100' },
  hands: { bg: 'bg-hands-50/95',  text: 'text-hands-800', accent: 'text-hands-600', border: 'border-hands-100', hover: 'hover:text-hands-600', activeBg: 'bg-hands-100' },
  sound: { bg: 'bg-sound-50/95',  text: 'text-sound-800', accent: 'text-sound-600', border: 'border-sound-100', hover: 'hover:text-sound-600', activeBg: 'bg-sound-100' },
}

export default function SiteHeader({ brand }: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const scheme = colorSchemes[brand.colorScheme]

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={clsx(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scheme.bg, 'backdrop-blur-md',
      scrolled ? `shadow-soft border-b ${scheme.border}` : 'border-b border-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center text-lg font-heading font-bold',
              'bg-gradient-to-br from-yoga-600 to-yoga-800 text-white shadow-sm',
              'group-hover:shadow-glow transition-shadow duration-300'
            )}>
              {brand.name.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <p className={clsx('font-heading font-semibold text-base leading-tight', scheme.text)}>
                {brand.name}
              </p>
              {brand.slug === 'sacred-vibes-yoga' && (
                <p className="text-xs text-sacred-500 tracking-widest uppercase">Wellness Studio</p>
              )}
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {brand.navLinks.map((link) => (
              <div key={link.href} className="relative group">
                <Link
                  href={link.href}
                  className={clsx(
                    'px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                    scheme.text, scheme.hover, `hover:${scheme.activeBg}`
                  )}
                >
                  {link.label}
                  {link.children && (
                    <svg className="inline-block ml-1 w-3 h-3 opacity-60" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M6 8L2 4h8L6 8z"/>
                    </svg>
                  )}
                </Link>
                {link.children && (
                  <div className={clsx(
                    'absolute top-full left-0 mt-1 w-48 rounded-xl border shadow-card opacity-0 invisible',
                    'group-hover:opacity-100 group-hover:visible transition-all duration-200',
                    'bg-white', scheme.border, 'overflow-hidden'
                  )}>
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={clsx(
                          'block px-4 py-2.5 text-sm transition-colors',
                          scheme.text, scheme.hover, `hover:${scheme.activeBg}`
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/contact"
              className={clsx(
                'px-5 py-2 rounded-xl text-sm font-medium border transition-all duration-200',
                'border-yoga-300 text-yoga-700 hover:bg-yoga-50'
              )}
            >
              Contact
            </Link>
            <Link
              href={brand.slug === 'sacred-hands' ? '/booking' : '/events'}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-yoga-700 text-white hover:bg-yoga-800 shadow-sm transition-all duration-200"
            >
              {brand.slug === 'sacred-hands' ? 'Book Now' : 'Register'}
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={clsx('lg:hidden p-2 rounded-lg transition-colors', scheme.text, `hover:${scheme.activeBg}`)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className={clsx('lg:hidden border-t', scheme.border, 'bg-white/98 backdrop-blur-md animate-slide-down')}>
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {brand.navLinks.map((link) => (
              <div key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={clsx(
                    'block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    scheme.text, scheme.hover, `hover:${scheme.activeBg}`
                  )}
                >
                  {link.label}
                </Link>
                {link.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setIsOpen(false)}
                    className={clsx(
                      'block px-8 py-2 text-sm transition-colors text-sacred-600 hover:text-sacred-900',
                      `hover:${scheme.activeBg}`, 'rounded-xl'
                    )}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}
            <div className="flex gap-3 pt-3 border-t border-sacred-100 mt-2">
              <Link
                href={brand.slug === 'sacred-hands' ? '/booking' : '/events'}
                onClick={() => setIsOpen(false)}
                className="flex-1 text-center px-4 py-2.5 rounded-xl text-sm font-medium bg-yoga-700 text-white"
              >
                {brand.slug === 'sacred-hands' ? 'Book Now' : 'Register'}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
