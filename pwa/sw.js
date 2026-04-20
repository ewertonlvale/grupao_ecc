/* ================================================
 * Service Worker — Catálogo da Comunidade + Push
 * ================================================
 * Versão com push notifications via OneSignal.
 *
 * Estratégia:
 *   1. Importa o SW do OneSignal (deve ser a PRIMEIRA linha).
 *      → ele registra handlers próprios de push/notificationclick.
 *   2. Cache-first para a "app shell" (HTML, manifest, ícones).
 *   3. Bypass total para script.google.com, cdn.onesignal.com etc.
 *   4. Network-first com fallback para outros recursos same-origin.
 * ================================================ */

// IMPORTANTE: importScripts precisa vir ANTES de qualquer addEventListener.
// O SDK do OneSignal registra seus próprios listeners de 'push' e
// 'notificationclick' — não mexemos neles.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const VERSION = 'v1.1.0'; // bump ao mexer em qualquer arquivo da shell
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

  // Bypass explícito: Apps Script, Drive, Analytics, fontes, OneSignal
  const bypass = [
    'script.google.com',
    'googleusercontent.com',
    'drive.google.com',
    'googletagmanager.com',
    'google-analytics.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.onesignal.com',
    'onesignal.com',
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
    if (fresh && fresh.status === 200 && fresh.type === 'basic') {
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (err) {
    const fallback = await cache.match('./site_catalogo.html');
    if (fallback) return fallback;
    throw err;
  }
}

// ---------- Mensagens do app (forçar update, etc) ----------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
