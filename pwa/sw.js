/* ================================================
 * Service Worker — Catálogo da Comunidade
 * ================================================
 * Estratégia:
 *   1. Cache-first para a "app shell" (HTML, manifest, ícones)
 *      → abre instantâneo mesmo offline.
 *   2. Bypass total para script.google.com (conteúdo dinâmico do iframe).
 *      → o SW só controla mesma origem; manter explícito para clareza.
 *   3. Network-first para qualquer outro recurso same-origin, com fallback no cache.
 * ================================================ */

const VERSION = 'v1.0.0';
const CACHE_NAME = `catalogo-ecc-${VERSION}`;

const APP_SHELL = [
  './',
  './site_catalogo.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  './favicon.png',
];

// ---------- Install: pré-cache da shell ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW] Falha no pré-cache:', err))
  );
});

// ---------- Activate: limpar caches antigos ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n.startsWith('catalogo-ecc-') && n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// ---------- Fetch: roteamento por URL ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Só interceptamos GET
  if (req.method !== 'GET') return;

  // Bypass explícito: Apps Script, Drive, Analytics, fontes
  const bypass = [
    'script.google.com',
    'googleusercontent.com',
    'drive.google.com',
    'googletagmanager.com',
    'google-analytics.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
  ];
  if (bypass.some((host) => url.hostname.includes(host))) {
    return; // deixa o browser tratar normalmente
  }

  // App shell (same-origin): cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(req));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const fresh = await fetch(request);
    // Só cacheia respostas OK
    if (fresh && fresh.status === 200 && fresh.type === 'basic') {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    // Offline e não temos no cache: devolve a home
    const fallback = await cache.match('./site_catalogo.html');
    if (fallback) return fallback;
    throw err;
  }
}

// ---------- Mensagens do app (forçar update, etc) ----------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
