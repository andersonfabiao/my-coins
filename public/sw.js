const CACHE = "minha-colecao-v2";
const BASE = new URL("./", self.location.href).pathname.replace(/\/$/, "");
const withBase = (path) => `${BASE}${path}`;
const CORE = [
  "/",
  "/catalogo/",
  "/colecao/",
  "/faltantes/",
  "/ajustes/",
  "/offline.html",
  "/manifest.webmanifest",
].map(withBase);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request)
          .then((response) => {
            if (!response.ok || response.type === "opaque") return response;
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(event.request, copy));
            return response;
          })
          .catch(() =>
            event.request.mode === "navigate"
              ? caches.match(withBase("/offline.html"))
              : undefined,
          ),
    ),
  );
});
