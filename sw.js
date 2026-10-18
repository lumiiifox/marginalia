// Marginalia service worker: lets the app open offline and caches the reading libraries.
// Pages from this site are fetched fresh when online, so updates show up on the next open.
const CACHE = "marginalia-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
  "./data/glossary.js", "./data/thinkers.js", "./data/branches.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const keep = (res) => { if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; };
  if (url.origin === self.location.origin && url.pathname.includes("/data/books/")) return; // the classics: fetched once into the library, so not kept here too
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req).then(keep).catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html"))));
  } else if (/^(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(keep)));
  }
});
