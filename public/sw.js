/* CourierFlow service worker — minimal & safe.
   Precaches a branded offline page and serves it when a navigation fails (no
   network). Everything else passes straight through, so we never serve stale
   API/auth responses or hashed assets. */
const CACHE = "cf-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only handle top-level page navigations; let assets/API use the network.
  if (req.method === "GET" && req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
  }
});
