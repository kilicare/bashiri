/**
 * Bashiri Service Worker
 * ========================
 * Caching strategy imetofautishwa kwa aina 3 za requests:
 * 1. API calls (/api/*)          -> NETWORK-ONLY (kamwe usicache — data lazima iwe mpya)
 * 2. WebSocket (/ws/*)           -> HAIGUSWI KABISA (fetch handler haihusiki nayo hata kidogo)
 * 3. Static assets (JS/CSS/img)  -> STALE-WHILE-REVALIDATE (onyesha cache haraka, sasisha nyuma)
 * 4. Navigation (pages)          -> NETWORK-FIRST, fallback /offline
 *
 * FCM (Firebase Cloud Messaging) push notifications zinashughulikiwa
 * chini ya faili hii pia (background messages).
 */

const CACHE_VERSION = "bashiri-v3";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = ["/manifest.json", "/icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Don't skipWaiting immediately - wait for user to trigger update
});

// Handle SKIP_WAITING message from client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("bashiri-") && !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // WebSocket connections HAZIGUSWI KABISA na Service Worker
  if (url.pathname.startsWith("/ws/") || event.request.headers.get("upgrade") === "websocket") {
    return;
  }

  // API calls kwenda backend -> NETWORK-ONLY, kamwe usicache
  if (url.pathname.startsWith("/api/") || url.hostname !== self.location.hostname) {
    // (hostname !== self.location.hostname inashughulikia backend ikiwa domain tofauti,
    // na Cloudinary images/videos - hizo TAYARI zina caching yao ya CDN, hazihitaji SW cache)
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigation (kufungua page mpya) -> NETWORK-FIRST, fallback offline page
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Network failed, try to serve offline page from cache
          return caches.match(OFFLINE_URL).then((cached) => {
            if (cached) return cached;
            // If not in cache, try to fetch and cache it
            return fetch(OFFLINE_URL).then((response) => {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(OFFLINE_URL, clone));
              return response;
            }).catch(() => {
              // If everything fails, return basic offline response
              return new Response("Offline - No internet connection", {
                status: 503,
                statusText: "Service Unavailable",
                headers: new Headers({ "Content-Type": "text/plain" })
              });
            });
          });
        })
    );
    return;
  }

  // Static assets (JS/CSS/fonts/local images) -> STALE-WHILE-REVALIDATE
  if (
    event.request.destination === "script" ||
    event.request.destination === "style" ||
    event.request.destination === "font" ||
    event.request.destination === "image"
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            })
            .catch(() => cachedResponse);
          return cachedResponse || fetchPromise;
        })
      )
    );
    return;
  }

  // Default: network-only kwa kila kitu kingine
  event.respondWith(fetch(event.request));
});

// ============================================================
// FIREBASE CLOUD MESSAGING (Push Notifications Halisi)
// ============================================================
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "WEKA_FIREBASE_API_KEY",
  authDomain: "WEKA_FIREBASE_PROJECT.firebaseapp.com",
  projectId: "WEKA_FIREBASE_PROJECT",
  messagingSenderId: "WEKA_SENDER_ID",
  appId: "WEKA_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Bashiri";
  const body = payload.notification?.body || "";
  const data = payload.data || {};

  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data,
    tag: data.tag || "bashiri-notification",
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.click_action || "/home";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.navigate(targetUrl);
        return existing.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});