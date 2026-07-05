const CACHE_NAME = "autocar-admin-shell-v1";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/assets/autocar-clean-logo.png",
  "/assets/background.png",
  "/assets/component-background.png",
  "/assets/iniciar-atendimento.png",
  "/assets/card-clientes.png",
  "/assets/card-orcamento.png",
  "/assets/card-financeiro.png",
  "/assets/card-alertas.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.startsWith("/api/")) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => (
      cachedResponse || fetch(event.request)
    ))
  );
});
