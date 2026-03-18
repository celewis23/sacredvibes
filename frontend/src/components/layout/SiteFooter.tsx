import Link from 'next/link'
import type { BrandContext } from '@/lib/brand/resolution'

interface SiteFooterProps {
  brand: BrandContext
}

export default function SiteFooter({ brand }: SiteFooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-sacred-900 text-sacred-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-yoga-700 flex items-center justify-center text-white font-heading font-bold text-lg">
                {brand.name.charAt(0)}
              </div>
              <p className="font-heading font-semibold text-white text-lg">{brand.name}</p>
            </div>
            <p className="text-sacred-400 text-sm leading-relaxed max-w-sm">
              {brand.slug === 'sacred-vibes-yoga' && 'A holistic wellness sanctuary dedicated to nurturing body, mind, and spirit through yoga, sound healing, and therapeutic massage.'}
              {brand.slug === 'sacred-hands' && 'Transformative massage therapy designed to melt tension, restore balance, and return you to yourself.'}
              {brand.slug === 'sacred-sound' && 'A portal into vibrational healing through sound baths, singing bowls, gong immersions, and our signature Sound on the River experiences.'}
            </p>
            <div className="flex gap-3 mt-6">
              {['Instagram', 'Facebook'].map((platform) => (
                <a
                  key={platform}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-sacred-800 hover:bg-sacred-700 flex items-center justify-center text-sacred-300 hover:text-white transition-colors text-xs font-medium"
                >
                  {platform.slice(0, 2)}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="font-medium text-white text-sm mb-4 tracking-wide">Navigation</p>
            <ul className="space-y-2.5">
              {brand.navLinks.slice(0, 6).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-sacred-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact / Sub-brands */}
          <div>
            <p className="font-medium text-white text-sm mb-4 tracking-wide">Connect</p>
            <ul className="space-y-2.5 text-sm text-sacred-400">
              <li>Asheville, NC</li>
              <li>
                <a href="mailto:info@sacredvibesyoga.com" className="hover:text-white transition-colors">
                  info@sacredvibesyoga.com
                </a>
              </li>
              {brand.slug === 'sacred-vibes-yoga' && (
                <>
                  <li className="pt-2">
                    <a href="https://hands.sacredvibesyoga.com" className="hover:text-white transition-colors">
                      Sacred Hands →
                    </a>
                  </li>
                  <li>
                    <a href="https://sound.sacredvibesyoga.com" className="hover:text-white transition-colors">
                      Sacred Sound →
                    </a>
                  </li>
                </>
              )}
              {brand.slug !== 'sacred-vibes-yoga' && (
                <li className="pt-2">
                  <a href="https://sacredvibesyoga.com" className="hover:text-white transition-colors">
                    Sacred Vibes Yoga →
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-sacred-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-sacred-500">
          <p>&copy; {year} {brand.name}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-sacred-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-sacred-300 transition-colors">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
