import type { Metadata } from 'next'
import { Cormorant_Garamond, Lato } from 'next/font/google'
import { Toaster } from 'sonner'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${lato.variable}`}>
      <body className="font-body text-sacred-900 bg-sacred-50 antialiased">
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  )
}
