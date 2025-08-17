# SmartFlow AIbot-Social — PWA Edition
What's new:
- ✅ Installable PWA (manifest) with offline cache + instant updates
- ✅ Network-first for HTML (fresh when online), cache fallback, offline page
- ✅ Cache-first for static assets with background refresh
- ✅ Update toast prompts users to refresh when a new version is ready

How to test:
1) Load the site once online (this seeds the cache).
2) Turn off your internet and refresh: you should see pages load from cache; navigations fall back to **offline.html**.
3) Deploy a change (version in sw.js updates). You'll see the "Update ready" toast; press **Refresh** to swap instantly.