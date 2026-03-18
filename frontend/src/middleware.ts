import { type NextRequest, NextResponse } from 'next/server'

const BRAND_HOST_MAP: Record<string, string> = {
  'sacredvibesyoga.com':       'sacred-vibes-yoga',
  'hands.sacredvibesyoga.com': 'sacred-hands',
  'sound.sacredvibesyoga.com': 'sacred-sound',
  'admin.sacredvibesyoga.com': 'admin',
  'sacredvibesyoga.local':       'sacred-vibes-yoga',
  'hands.sacredvibesyoga.local': 'sacred-hands',
  'sound.sacredvibesyoga.local': 'sacred-sound',
  'admin.sacredvibesyoga.local': 'admin',
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const hostname = host.replace(/:\d+$/, '').toLowerCase()

  // Determine brand from host
  let brand = BRAND_HOST_MAP[hostname]

  // Dev: allow ?brand= override or x-brand header
  if (!brand) {
    brand = request.nextUrl.searchParams.get('brand')
      ?? request.headers.get('x-brand')
      ?? 'sacred-vibes-yoga'
  }

  const isAdmin = brand === 'admin'
  const pathname = request.nextUrl.pathname

  // Redirect admin subdomain to /admin/* paths
  if (isAdmin && !pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Protect admin routes: require auth cookie
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('access_token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Pass brand context through request and response headers so server components
  // can honor localhost query-param overrides during development.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-brand', brand)
  requestHeaders.set('x-hostname', hostname)
  requestHeaders.set('x-pathname', pathname)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
  response.headers.set('x-brand', brand)
  response.headers.set('x-hostname', hostname)
  response.headers.set('x-pathname', pathname)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads|fonts|images).*)',
  ],
}
