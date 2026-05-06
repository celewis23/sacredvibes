import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sacred Vibes Healing & Wellness',
    short_name: 'Sacred Vibes',
    description: 'Your sacred wellness portal — digital studio, bookings, and more.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FAF7F4',
    theme_color: '#7B6E5D',
    orientation: 'portrait-primary',
    categories: ['health', 'fitness', 'lifestyle'],
    icons: [
      { src: '/api/pwa-icon?size=192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/api/pwa-icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/api/pwa-icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Digital Studio',
        short_name: 'Studio',
        description: 'Access your digital studio library',
        url: '/digital-studio/library',
        icons: [{ src: '/api/pwa-icon?size=96', sizes: '96x96' }],
      },
      {
        name: 'My Account',
        short_name: 'Account',
        description: 'View your account and subscription',
        url: '/account',
        icons: [{ src: '/api/pwa-icon?size=96', sizes: '96x96' }],
      },
    ],
  }
}
