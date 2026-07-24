const CACHE_PREFIX = "minha-colecao-";
const CACHE = `${CACHE_PREFIX}v11-20260724-colecao-avancada`;
const BASE = new URL("./", self.location.href).pathname.replace(/\/$/, "");
const withBase = (path) => `${BASE}${path}`;
const CORE = ["/", "/catalogo/", "/colecao/", "/faltantes/", "/ajustes/", "/offline.html", "/manifest.webmanifest"].map(withBase);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || caches.match(withBase("/offline.html"));
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type !== "opaque") {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.endsWith("/sw.js")) return;
  event.respondWith(request.mode === "navigate" ? networkFirst(request) : cacheFirst(request));
});
