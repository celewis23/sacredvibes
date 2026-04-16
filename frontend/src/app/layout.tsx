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

// Fallback colors per brand slug, matching seed data
const BRAND_THEME_DEFAULTS: Record<string, { primaryColor: string; accentColor: string; backgroundColor: string; textColor: string }> = {
  'sacred-vibes-yoga': { primaryColor: '#7B6E5D', accentColor: '#C4A882', backgroundColor: '#FAF7F4', textColor: '#3D3530' },
  'sacred-hands':      { primaryColor: '#6B5E52', accentColor: '#B89B82', backgroundColor: '#FBF8F5', textColor: '#3A302B' },
  'sacred-sound':      { primaryColor: '#5C5A7E', accentColor: '#9B8FC4', backgroundColor: '#F8F7FC', textColor: '#2E2D45' },
}

async function fetchBrandTheme(slug: string): Promise<{ primaryColor: string; accentColor: string; backgroundColor: string; textColor: string }> {
  const defaults = BRAND_THEME_DEFAULTS[slug] ?? BRAND_THEME_DEFAULTS['sacred-vibes-yoga']
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
    const res = await fetch(`${apiUrl}/api/brands`, { next: { revalidate: 300 } })
    if (!res.ok) return defaults
    const json = await res.json()
    const brand = (json?.data as Array<{ slug: string; themeSettingsJson: string }> | undefined)
      ?.find(b => b.slug === slug)
    if (!brand) return defaults
    const theme = JSON.parse(brand.themeSettingsJson || '{}') as Partial<typeof defaults>
    return {
      primaryColor:   theme.primaryColor   ?? defaults.primaryColor,
      accentColor:    theme.accentColor    ?? defaults.accentColor,
      backgroundColor: theme.backgroundColor ?? defaults.backgroundColor,
      textColor:      theme.textColor      ?? defaults.textColor,
    }
  } catch {
    return defaults
  }
}

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
  const theme = await fetchBrandTheme(brand.slug)

  const brandCssVars = `
    :root {
      --brand-primary: ${theme.primaryColor};
      --brand-accent:  ${theme.accentColor};
      --brand-bg:      ${theme.backgroundColor};
      --brand-text:    ${theme.textColor};
    }
  `

  return (
    <html lang="en" className={`${cormorant.variable} ${lato.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandCssVars }} />
      </head>
      <body className="font-body text-sacred-900 bg-white antialiased">
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
