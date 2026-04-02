const CACHE_NAME = 'pub-golf-pwa-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './images/pubs/bamburgh.webp',
  './images/pubs/new-crown.jpg',
  './images/pubs/sanddancer.jpg',
  './images/pubs/rattler.jpg',
  './images/pubs/sundial.jpg',
  './images/pubs/marine.jpg',
  './images/pubs/hogarths.jpg',
  './images/pubs/spoons.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
