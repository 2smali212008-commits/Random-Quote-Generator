const CACHE_NAME = "daily-inspiration-v1";
const APP_SCOPE = self.registration.scope;
const HOME_URL = new URL("./index.html", APP_SCOPE).href;

const APP_FILES = [
  new URL("./", APP_SCOPE).href,
  HOME_URL,
  new URL("./quotes.html", APP_SCOPE).href,
  new URL("./manifest.json", APP_SCOPE).href,
  new URL("./icon-192.png", APP_SCOPE).href,
  new URL("./icon-512.png", APP_SCOPE).href
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith("daily-inspiration-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const requestURL = new URL(request.url);
  if (requestURL.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }

        return response;
      } catch (error) {
        return await caches.match(request) ||
               await caches.match(HOME_URL);
      }
    })());

    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);

      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }

      return response;
    } catch (error) {
      return Response.error();
    }
  })());
});