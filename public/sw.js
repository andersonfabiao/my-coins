const CACHE_PREFIX = "minha-colecao-";
const VERSION = "v14-20260724-auditoria";
const SHELL_CACHE = `${CACHE_PREFIX}shell-${VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-${VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}images-${VERSION}`;
const BASE = new URL("./", self.location.href).pathname.replace(/\/$/, "");
const withBase = (path) => `${BASE}${path}`;
const CORE = ["/", "/catalogo/", "/colecao/", "/faltantes/", "/estatisticas/", "/ajustes/", "/offline.html", "/manifest.webmanifest"].map(withBase);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && ![SHELL_CACHE, RUNTIME_CACHE, IMAGE_CACHE].includes(key)).map((key) => caches.delete(key)));
    if ("navigationPreload" in self.registration) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

async function trimCache(cacheName, maximum) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - maximum)).map((key) => cache.delete(key)));
}

async function networkFirst(request, event) {
  try {
    const preload = await event.preloadResponse;
    const response = preload || await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || caches.match(withBase("/offline.html"));
  }
}

async function staleWhileRevalidate(request, event) {
  const cacheName = request.destination === "image" ? IMAGE_CACHE : RUNTIME_CACHE;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const update = fetch(request).then(async (response) => {
    if (response.ok && response.type !== "opaque") {
      await cache.put(request, response.clone());
      if (cacheName === IMAGE_CACHE) await trimCache(IMAGE_CACHE, 180);
    }
    return response;
  }).catch(() => cached);
  if (cached) {
    event.waitUntil(update);
    return cached;
  }
  return update;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.endsWith("/sw.js")) return;
  event.respondWith(request.mode === "navigate" ? networkFirst(request, event) : staleWhileRevalidate(request, event));
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
