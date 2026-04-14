import { type NextRequest, NextResponse } from 'next/server'

const BRAND_HOST_MAP: Record<string, string> = {
  'sacredvibesyoga.com':       'sacred-vibes-yoga',
  'hands.sacredvibesyoga.com': 'sacred-hands',
  'sound.sacredvibesyoga.com': 'sacred-sound',
  'admin.sacredvibesyoga.com': 'admin',
  'sacredvibesyoga.local':     'sacred-vibes-yoga',
  'hands.sacredvibesyoga.local': 'sacred-hands',
  'sound.sacredvibesyoga.local': 'sacred-sound',
  'admin.sacredvibesyoga.local': 'admin',
}

// Path prefixes that map to sub-brands
const BRAND_PATH_PREFIXES: Record<string, string> = {
  '/hands': 'sacred-hands',
  '/sound': 'sacred-sound',
}

const LEGACY_SUBDOMAIN_BASE_PATHS: Record<string, string> = {
  'hands.sacredvibesyoga.com': '/hands',
  'sound.sacredvibesyoga.com': '/sound',
  'hands.sacredvibesyoga.local': '/hands',
  'sound.sacredvibesyoga.local': '/sound',
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const hostname = host.replace(/:\d+$/, '').toLowerCase()
  const pathname = request.nextUrl.pathname
  const search = request.nextUrl.search

  const legacyBasePath = LEGACY_SUBDOMAIN_BASE_PATHS[hostname]
  if (legacyBasePath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.hostname = hostname.endsWith('.local') ? 'sacredvibesyoga.local' : 'sacredvibesyoga.com'
    redirectUrl.pathname = pathname === '/' ? legacyBasePath : `${legacyBasePath}${pathname}`
    redirectUrl.search = search
    return NextResponse.redirect(redirectUrl, 308)
  }

  // 1. Path-prefix brand detection (takes priority over host)
  let brand: string | undefined
  let rewritePath: string | undefined

  for (const [prefix, slug] of Object.entries(BRAND_PATH_PREFIXES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      brand = slug
      rewritePath = pathname === prefix ? '/' : pathname.slice(prefix.length)
      break
    }
  }

  // 2. Host-based brand detection
  if (!brand) {
    brand = BRAND_HOST_MAP[hostname]
  }

  // 3. Dev overrides / fallback
  if (!brand) {
    brand = request.nextUrl.searchParams.get('brand')
      ?? request.headers.get('x-brand')
      ?? 'sacred-vibes-yoga'
  }

  const isAdmin = brand === 'admin'

  // Redirect admin host to /admin/* paths
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

  // Pass brand context through request headers so server components can read it
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-brand', brand)
  requestHeaders.set('x-hostname', hostname)
  requestHeaders.set('x-pathname', pathname)

  // Rewrite sub-brand paths to shared routes (browser URL stays as-is)
  if (rewritePath !== undefined) {
    const rewriteUrl = new URL(rewritePath || '/', request.url)
    rewriteUrl.search = search
    return NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    })
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
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
