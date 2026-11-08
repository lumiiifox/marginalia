// Marginalia service worker: lets the app open offline and caches the reading libraries.
// Pages from this site are fetched fresh when the connection answers in time, so updates show up on the next open; on a connection
// that stalls the app opens from its saved copy within a few seconds.
const CACHE = "marginalia-v7";
// Every file index.html loads (tests/smoke.py checks this list against index.html).
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./css/app.css",
  "./data/glossary.js", "./data/thinkers.js", "./data/branches.js", "./data/recommendations.js",
  "./js/core.js", "./js/storage.js", "./js/cite.js", "./js/import.js", "./js/library.js", "./js/writing.js", "./js/study.js",
  "./js/reference.js", "./js/sheets.js", "./js/wikisource.js", "./js/bookmenu.js", "./js/reader.js", "./js/structure.js", "./js/discovery.js", "./js/mastery.js", "./js/cloud-backup.js", "./js/boot.js"];
// How long an opening waits for the page itself before using the saved copy, and how long one of its files waits once the page came.
const PAGE_WAIT = 3000, FILE_WAIT = 8000;
// Openings that started from the saved copy (by the page's client id): every file they load comes from the saved copy too, so an
// opening never runs a mix of new and old scripts. A page whose answer came in time loads its files fresh.
const SAVED = new Set();

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

// The network's answer, or null once `ms` pass without one (the request goes on; its answer is then dropped).
const within = (p, ms) => Promise.race([p, new Promise((res) => setTimeout(() => res(null), ms))]);

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const keep = (res) => { if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; };
  if (url.origin === self.location.origin && url.pathname.includes("/data/books/")) return; // the classics: fetched once into the library, so not kept here too
  if (url.origin === self.location.origin) {
    // The app's own files are checked with the server each time (cheaply, by ETag), so after an update the page never runs a mix of
    // new and old scripts out of the browser's HTTP cache. With a saved copy, the page waits PAGE_WAIT for its answer and a file
    // FILE_WAIT; without one (the first visit) there is nothing else to show, so the answer is waited for.
    const page = req.mode === "navigate";
    e.respondWith((async () => {
      const saved = await caches.match(req).then((hit) => hit || (page ? caches.match("./index.html") : null));
      if (!page && SAVED.has(e.clientId)) return saved || fetch(req, { cache: "no-cache" });
      // a late answer is not kept: the saved copy stays one whole version until an opening fetches it all fresh
      const net = (page ? fetch(req) : fetch(req, { cache: "no-cache" })).catch(() => null);
      const res = saved ? await within(net, page ? PAGE_WAIT : FILE_WAIT) : await net;
      if (res) return keep(res);
      if (saved) { if (page && e.resultingClientId) SAVED.add(e.resultingClientId); return saved; }
      return Response.error();
    })());
  } else if (/^(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) {
    // A library checked against its hash is asked for with CORS; a copy saved from before the check (opaque) can't answer that, so it
    // is fetched again, and the CORS copy replaces it.
    e.respondWith(caches.match(req).then((hit) => (hit && !(hit.type === "opaque" && req.mode === "cors") ? hit : fetch(req).then(keep))));
  }
});
