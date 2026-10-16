// Keeps Grandma Nuan opening when the connection is poor.
// The page itself is fetched network-first, so new quotes pushed each night show up as soon as there is a connection.
const CACHE = "yai-nuan-v1";
const PRECACHE = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png"];
// Fonts and the QR library come from these hosts; they never change, so a cached copy is fine
const STATIC_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // The app page: network first, cached copy when offline
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("/", copy)); return res; })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Fonts and libraries: cache first
  if (STATIC_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
      }))
    );
    return;
  }

  // Our own files (icons, manifest): serve the cached copy, refresh it in the background
  if (url.origin === self.location.origin && !url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req).then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
