const CACHE_NAME = 'stockflow-cache-v2'
const URLS_TO_CACHE = [
  '/',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
  )
})

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return
  
  // Ignore Vite dev server, WebSockets, and API/Inertia requests
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/vite-dev/')) return
  if (event.request.headers.get('X-Inertia')) return
  
  // Ignore non-http requests (e.g., chrome-extension://)
  if (!event.request.url.startsWith('http')) return

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request).catch(() => {
          // Gracefully handle failed fetches (e.g. offline, blocked, or missing Leaflet tiles)
          // without throwing Uncaught Promise errors in the console.
          return new Response('', { status: 503, statusText: 'Service Unavailable' })
        })
      })
  )
})

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
