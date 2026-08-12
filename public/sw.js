/**
 * AdminHub service worker.
 *
 * Does two jobs that used to need two workers:
 *   1. App shell caching + offline fallback, so the installed app opens
 *      instantly and degrades to a branded screen instead of the browser's
 *      dinosaur when the connection drops.
 *   2. Firebase background push (previously in firebase-messaging-sw.js).
 *
 * Merging them matters: the FCM worker was only registered *after* the admin
 * granted notification permission, so on a first visit there was no service
 * worker at all — and without one Chrome will not offer to install the app.
 * This one registers on load.
 *
 * Admin data is NEVER cached. A stale vendor list or commission balance that
 * looks live is worse than no data, so API responses are network-only.
 */

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB9qIwhzOlXvHrJJpxI9fzKhvGjtRbN7ws",
  authDomain: "konura-4450d.firebaseapp.com",
  projectId: "konura-4450d",
  storageBucket: "konura-4450d.firebasestorage.app",
  messagingSenderId: "333244137876",
  appId: "1:333244137876:web:cbe408322a062e399d0f81",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // The backend sends data-only messages (title/body in `data`) so the browser
  // doesn't auto-display AND fire this handler, which would double the banner.
  const data = payload.data || {};
  const title = payload.notification?.title || data.title || "New admin notification";
  self.registration.showNotification(title, {
    body: payload.notification?.body || data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [100, 50, 100],
    data,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.action_url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Prefer focusing an already-open admin window over opening a second one.
      for (const client of windowClients) {
        if (client.url.includes(target) && "focus" in client) return client.focus();
      }
      if (windowClients.length > 0 && "focus" in windowClients[0]) {
        windowClients[0].navigate(target);
        return windowClients[0].focus();
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});

/* ── App shell ─────────────────────────────────────────────────────────── */

const VERSION = "adminhub-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

const SHELL_ASSETS = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      // A missing shell asset must not wedge the whole worker.
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:css|js|woff2?|png|jpg|jpeg|svg|gif|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Same-origin only — never interpose on Firebase, S3 uploads or the backend.
  if (url.origin !== self.location.origin) return;

  // Admin data and auth: always the network, never a cache.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: try the network so the admin always sees live data, and fall
  // back to the offline screen only when there's genuinely no connection.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline.html").then((cached) =>
          cached ??
          new Response("You are offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          })
        )
      )
    );
    return;
  }

  // Build output is content-hashed, so cache-first is safe and makes cold
  // starts feel native.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
