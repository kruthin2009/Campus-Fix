const CACHE_NAME = "campusfix-shell-v208-no-ai-r1";
const APP_SHELL = ["/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("campusfix-shell-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // APIs must always be network-only. Caching API errors or SPA fallback HTML
  // caused JSON parsing failures in serverless JSON endpoints.
  if (url.pathname.startsWith("/api/")) return;

  // Always ask the network for navigations so users receive the latest app
  // shell and hashed asset manifest after a deployment.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }

  // Cache only immutable build assets and small app-shell resources.
  const isStaticAsset = url.pathname.startsWith("/assets/") ||
    url.pathname === "/manifest.webmanifest" || url.pathname === "/favicon.svg";
  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok && response.type === "basic") {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});
