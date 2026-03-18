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
    default: 'Sacred Vibes Yoga | Holistic Wellness Studio',
    template: '%s | Sacred Vibes Yoga',
  },
  description: 'A holistic wellness sanctuary dedicated to yoga, sound healing, and therapeutic massage in Asheville, NC.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Sacred Vibes Yoga',
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

  return (
    <html lang="en" className={`${cormorant.variable} ${lato.variable}`}>
      <body className="font-body text-sacred-900 bg-sacred-50 antialiased">
        <Providers>
          {!isAdminRoute && <SiteHeader brand={brand} />}
          {children}
          {!isAdminRoute && <SiteFooter brand={brand} />}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  )
}
