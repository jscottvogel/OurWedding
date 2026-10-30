/* WeddingSteward service worker — hand-written, no dependencies.
 * Strategy: network-first for navigations and same-origin static assets,
 * falling back to cache when offline. Never caches API, AppSync, S3,
 * Cognito/auth, or any cross-origin / non-GET request.
 */
const VERSION = 'v1';
const CACHE = `ws-pages-${VERSION}`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('ws-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

function isCacheable(request, url) {
  if (request.method !== 'GET') return false;
  if (url.origin !== self.location.origin) return false; // AppSync, S3, Cognito are cross-origin
  if (url.pathname.startsWith('/api/')) return false;
  if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/login') || url.pathname.startsWith('/signup')) return false;
  if (url.searchParams.has('X-Amz-Signature') || url.searchParams.has('X-Amz-Credential')) return false;
  if (request.headers.get('authorization')) return false;
  if (request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) return false; // RSC payloads vary per state
  if (request.mode === 'navigate') return true;
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (!isCacheable(request, url)) return; // let the browser handle it normally

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response && response.ok && response.type === 'basic') {
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch (err) {
        const cached = await cache.match(request, { ignoreVary: true });
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const fallback = (await cache.match('/dashboard')) || (await cache.match('/'));
          if (fallback) return fallback;
        }
        throw err;
      }
    })()
  );
});
