/* SmartFlow PWA Service Worker
   Strategy:
   - HTML navigations: network-first with cache fallback (and offline.html as last resort).
   - Static assets (CSS/JS/images): cache-first with background refresh (stale-while-revalidate-ish).
*/
const VERSION = 'sfs-v2025-08-17';
const ASSET_CACHE = `assets-${VERSION}`;
const PAGE_CACHE  = `pages-${VERSION}`;

const CORE_ASSETS = [
  './',
  'index.html',
  'styles.css',
  'script.js',
  'offline.html',
  'manifest.webmanifest',
  'assets/favicon.svg',
  'assets/noise.png',
  'assets/og.png'
];

self.addEventListener('install', (event)=>{
  event.waitUntil(
    caches.open(ASSET_CACHE).then(cache=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', (event)=>{
  event.waitUntil(
    caches.keys().then(keys=>{
      return Promise.all(keys.filter(k=>!k.includes(VERSION)).map(k=>caches.delete(k)));
    }).then(()=>self.clients.claim())
  );
});

// Listen for skip-waiting trigger from the page
self.addEventListener('message', (event)=>{
  if (event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event)=>{
  const req = event.request;
  const url = new URL(req.url);

  // Handle navigation (HTML) requests
  if (req.mode === 'navigate'){
    event.respondWith(
      fetch(req).then(res=>{
        const copy = res.clone();
        caches.open(PAGE_CACHE).then(c=>c.put(req, copy));
        return res;
      }).catch(async ()=>{
        const cached = await caches.match(req);
        return cached || caches.match('offline.html');
      })
    );
    return;
  }

  // Static assets: cache-first, then update cache in background
  if (['style','script','image','font'].includes(req.destination)){
    event.respondWith((async ()=>{
      const cached = await caches.match(req);
      const fetchPromise = fetch(req).then(res=>{
        const copy = res.clone();
        caches.open(ASSET_CACHE).then(c=>c.put(req, copy));
        return res;
      }).catch(()=>null);
      return cached || fetchPromise || new Response('', {status: 504});
    })());
    return;
  }
});