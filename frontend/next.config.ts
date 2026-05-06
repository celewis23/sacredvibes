import type { NextConfig } from 'next'

const apiUrl = process.env.NEXT_PUBLIC_API_URL
const apiImagePattern = (() => {
  if (!apiUrl) return null

  try {
    const url = new URL(apiUrl)
    return {
      protocol: url.protocol.replace(':', '') as 'http' | 'https',
      hostname: url.hostname,
    }
  } catch {
    return null
  }
})()

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '*.sacredvibesyoga.com' },
      ...(apiImagePattern ? [apiImagePattern] : []),
    ],
  },
  async rewrites() {
    if (!apiUrl) {
      return []
    }

    return [
      {
        source: '/uploads/:path*',
        destination: `${apiUrl}/uploads/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
  // Multi-brand support via middleware (see middleware.ts)
  // Path prefixes (/hands, /sound) map to sub-brand contexts; admin uses its own host
}

export default nextConfig
