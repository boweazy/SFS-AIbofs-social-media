# SmartFlow AIbot-Social — PWA Edition
What's new:
- ✅ Installable PWA (manifest) with offline cache + instant updates
- ✅ Network-first for HTML (fresh when online), cache fallback, offline page
- ✅ Cache-first for static assets with background refresh
- ✅ Update toast prompts users to refresh when a new version is ready
- ✅ /tester    Browser UI to call /api/generate_posts and preview results
- ✅ Tip: Use X for short copy (<=280 chars) and LinkedIn for long form.

## API Testing Features:
- /tester    Browser UI to call /api/generate_posts and preview results
- Tip: Use X for short copy (<=280 chars) and LinkedIn for long form.

DONE CRITERIA
- Visiting /tester shows a form.
- Submitting shows 1–10 cards with text, alt_text, suggested_image, hashtags.
- "Copy Text" button works.
- Nav includes "Generator".

How to test:
1) Load the site once online (this seeds the cache).
2) Turn off your internet and refresh: you should see pages load from cache; navigations fall back to **offline.html**.
3) Deploy a change (version in sw.js updates). You'll see the "Update ready" toast; press **Refresh** to swap instantly.