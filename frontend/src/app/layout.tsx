import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Cormorant_Garamond, Lato } from 'next/font/google'
import { Toaster } from 'sonner'
import SiteFooter from '@/components/layout/SiteFooter'
import SiteHeader from '@/components/layout/SiteHeader'
import { getCurrentBrand } from '@/lib/brand/current'
import Providers from './providers'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://sacredvibesyoga.com'),
  title: {
    default: 'Sacred Vibes Healing & Wellness | Align. Restore. Elevate.',
    template: '%s | Sacred Vibes Healing & Wellness',
  },
  description: 'A premium healing & wellness sanctuary merging ancient sacred practices with modern life. Yoga, sound healing, therapeutic massage, and energy work with Shanna Latia.',
  keywords: ['yoga', 'sound healing', 'wellness', 'energy healing', 'massage', 'sacred vibes', 'healing', 'meditation', 'Richmond', 'holistic wellness'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Sacred Vibes Healing & Wellness',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const isAdminRoute = pathname.startsWith('/admin')
  const brand = getCurrentBrand(headersList)
  // Only the homepage has a full-screen dark hero — all other pages need an opaque header
  const heroMode = pathname === '/'

  return (
    <html lang="en" className={`${cormorant.variable} ${lato.variable}`}>
      <body className="font-body text-sacred-900 bg-white antialiased">
        <Providers>
          {!isAdminRoute && <SiteHeader brand={brand} heroMode={heroMode} />}
          {children}
          {!isAdminRoute && <SiteFooter brand={brand} />}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  )
}
