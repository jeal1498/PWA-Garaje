// Service worker de Garaje: funciona sin internet. Sube CACHE en cada cambio o el teléfono no se actualiza.
const CACHE = 'garaje-v1';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/garaje.css',
  'js/garaje.js',
  'js/almacenamiento.js',
  'js/calculos.js',
  'js/iconos.js',
  'js/utilidades.js',
  'marca/tokens.css',
  'marca/icono-app.svg',
  'marca/fonts/bricolage-800.woff2',
  'marca/fonts/dmsans.woff2',
  'marca/fonts/jetbrains.woff2',
  'marca/png/icono-app-180.png',
  'marca/png/icono-app-192.png',
  'marca/png/icono-app-512.png',
  'marca/png/icono-maskable-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('garaje-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Stale-while-revalidate: responde de caché al instante y actualiza en segundo plano.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached || (req.mode === 'navigate' ? cache.match('index.html') : undefined));
      return cached || network;
    }),
  );
});
