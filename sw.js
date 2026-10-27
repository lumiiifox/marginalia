// Marginalia service worker: lets the app open offline and caches the reading libraries.
// Pages from this site are fetched fresh when online, so updates show up on the next open.
const CACHE = "marginalia-v7";
// Every file index.html loads (tests/smoke.py checks this list against index.html).
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./css/app.css",
  "./data/glossary.js", "./data/thinkers.js", "./data/branches.js", "./data/recommendations.js",
  "./js/core.js", "./js/storage.js", "./js/cite.js", "./js/import.js", "./js/library.js", "./js/writing.js", "./js/study.js",
  "./js/reference.js", "./js/sheets.js", "./js/wikisource.js", "./js/bookmenu.js", "./js/reader.js", "./js/structure.js", "./js/discovery.js", "./js/mastery.js", "./js/cloud-backup.js", "./js/boot.js"];

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
    // The app's own files are checked with the server each time (cheaply, by ETag), so after an update the page never runs a mix of
    // new and old scripts out of the browser's HTTP cache. Opening the page itself is left as the browser does it.
    const fresh = req.mode === "navigate" ? fetch(req) : fetch(req, { cache: "no-cache" });
    e.respondWith(fresh.then(keep).catch(() => caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("./index.html") : Response.error()))));
  } else if (/^(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(keep)));
  }
});
