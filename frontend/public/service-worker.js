const CACHE_NAME = "luxurystay-shell-v2";
const SHELL_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/pwa-badge.svg",
  "/icons/pwa-192.png",
  "/icons/pwa-512.png",
  "/icons/pwa-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith("luxurystay-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) return;

  if (/^\/(?:@vite|@react-refresh|src|node_modules)\//.test(url.pathname)) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put("/", response.clone());
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match("/"))
    );
    return;
  }

  if (["script", "style", "image", "font"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      })
    );
  }
});

self.addEventListener("push", (event) => {
  let payload;
  let fallbackBody = "";
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    fallbackBody = event.data?.text() || "";
  }

  const title = payload?.title || "LuxuryStay";
  const options = {
    body: payload?.body || fallbackBody || "You have a new update.",
    icon: payload?.icon || "/icons/pwa-192.png",
    badge: payload?.badge || "/icons/pwa-badge.svg",
    tag: payload?.tag || "luxurystay-update",
    data: payload?.data || { url: "/notifications" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const target = new URL(event.notification.data?.url || "/notifications", self.location.origin);
    if (target.origin !== self.location.origin) target.href = new URL("/notifications", self.location.origin).href;

    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin !== self.location.origin) continue;
      await client.focus();
      if (client.navigate) await client.navigate(target.href);
      return;
    }
    await self.clients.openWindow(target.href);
  })());
});
