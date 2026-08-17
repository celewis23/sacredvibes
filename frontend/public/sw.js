const CACHE = 'sv-v1'
const STATIC = ['/_next/static/', '/fonts/']
const SKIP = ['/api/', '/admin']

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Skip API calls and admin — always network
  if (SKIP.some(p => url.pathname.startsWith(p))) return

  // Cache-first for Next.js static assets (immutable)
  if (STATIC.some(p => url.pathname.startsWith(p))) {
    e.respondWith(
      caches.match(request).then(cached => cached ?? fetch(request).then(res => {
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(request, clone))
        return res
      }))
    )
    return
  }

  // Network-first for page navigations
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(request, clone))
          return res
        })
        .catch(() => caches.match(request) ?? caches.match('/'))
    )
  }
})

self.addEventListener('push', e => {
  let data = {}
  try { data = e.data ? e.data.json() : {} } catch { /* non-JSON payload, ignore */ }

  const title = data.title || 'Sacred Vibes'
  const options = {
    body: data.body || '',
    icon: '/api/pwa-icon?size=192',
    badge: '/api/pwa-icon?size=96',
    data: { url: data.url || '/admin' },
  }

  e.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/admin'

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      if (clients.length > 0 && 'focus' in clients[0]) {
        clients[0].navigate(url)
        return clients[0].focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
