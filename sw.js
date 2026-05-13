const CACHE = 'snake-pwa-v1';

const PRECACHE = [
  '/snake-pwa/',
  '/snake-pwa/index.html',
  '/snake-pwa/css/style.css',
  '/snake-pwa/js/game.js',
  '/snake-pwa/manifest.json',
  '/snake-pwa/icons/icon-192.png',
  '/snake-pwa/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.startsWith('chrome-extension://')) return;
  if (e.request.url.startsWith('http')) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request).catch(() => cached))
    );
  }
});
