// Offline mode for Pocket Arcade.
// Game files: try the network first so updates show up right away, fall back to the saved copy when offline.
// Fonts and the Firebase sign-in library: use the saved copy first, since those files never change.
const CACHE = 'pocket-arcade-v37';
const CORE = ['./', './index.html', './manifest.json', './icon.png', './icon-192.png', './apple-touch-icon.png', './tidy.html', './card-shop.html', './sudoku.html', './chess.html', './puzzles.json', './openings.json'];
// nice to have offline, but a missing one shouldn't stop the install
const EXTRA = ['./icon-drip.png', './icon-drip-192.png', './icon-solid.png', './icon-solid-192.png', './apple-touch-icon-drip.png', './apple-touch-icon-solid.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).then(() => Promise.all(EXTRA.map(u => c.add(u).catch(() => { }))))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(r => { clearTimeout(t); resolve(r); }, err => { clearTimeout(t); reject(err); });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'www.gstatic.com') {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      // no-cache: always check GitHub for a newer copy instead of using the browser's 10-minute cache
      const res = await withTimeout(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }), 4000);
      // save each page under its own address (the old code saved every page as index.html, so going
      // offline after playing Chess could open Chess instead of the arcade)
      if (res.ok) c.put(req.mode === 'navigate' ? url.origin + url.pathname : req, res.clone());
      return res;
    } catch (err) {
      return (await c.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' && url.pathname.endsWith('/') ? await c.match('./index.html') : undefined) || (req.mode === 'navigate' ? await c.match('./index.html') : undefined) || Response.error();
    }
  })());
});
