const CACHE_NAME = 'timelyone-app-shell-v3';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((k) =>
            k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()
          )
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // NUNCA cachear APIs - forçar bypass de TODOS os caches (Service Worker + HTTP)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req, {
        cache: 'no-store', // Força bypass do HTTP cache do browser
      })
    );
    return;
  }

  // NUNCA cachear requests autenticados
  if (req.headers.get('Authorization')) {
    event.respondWith(fetch(req));
    return;
  }

  // Navegação: Network-First (tenta servidor, fallback para cache)
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/index.html')));
    return;
  }

  // Assets estáticos: Cache-First (CSS, JS, imagens, fontes)
  event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});
