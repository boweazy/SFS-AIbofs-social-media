const CACHE_NAME = 'smartflow-socialscale-v2';
const urlsToCache = [
  '/',
  '/static/index.html',
  '/static/style.css',
  '/static/app.js',
  '/static/script.js',
  '/book.html',
  '/book.js',
  '/shop.html', 
  '/shop.js',
  '/bots.html',
  '/bots.js',
  '/assets/favicon.svg',
  '/assets/logo-stripe.svg',
  '/assets/logo-google.svg',
  '/assets/logo-buffer.svg',
  '/assets/logo-shopify.svg',
  '/assets/logo-twilio.svg',
  '/static/logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SmartFlow SocialScale: Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SmartFlow SocialScale: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});