```typescript
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const firebaseConfig = {
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      'YOUR_FIREBASE_API_KEY',

    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      'YOUR_FIREBASE_PROJECT.firebaseapp.com',

    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      'YOUR_FIREBASE_PROJECT',

    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID ||
      'YOUR_SENDER_ID',

    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      'YOUR_APP_ID',
  }

  const swContent = `
/**
 * ============================================================
 * BASHIRI SERVICE WORKER
 * ============================================================
 *
 * Responsibilities:
 *
 * 1. Cross-origin requests
 *    -> NEVER intercepted
 *    -> Render backend works directly from browser
 *    -> Cloudinary/Firebase/etc. remain untouched
 *
 * 2. Same-origin API (/api/*)
 *    -> NETWORK ONLY
 *    -> Never cached
 *
 * 3. WebSocket (/ws/*)
 *    -> NEVER intercepted
 *
 * 4. Navigation/pages
 *    -> NETWORK FIRST
 *    -> /offline.html fallback
 *
 * 5. Static assets
 *    -> STALE WHILE REVALIDATE
 *
 * 6. Firebase Cloud Messaging
 *    -> Background notifications
 * ============================================================
 */

const CACHE_VERSION = "bashiri-v6";
const STATIC_CACHE = \`\${CACHE_VERSION}-static`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  "/offline.html",
  "/icon-192.png",
];

/* ============================================================
 * INSTALL
 * ============================================================ */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );

  // Do not force skipWaiting here.
  // The application can trigger SKIP_WAITING explicitly.
});


/* ============================================================
 * MESSAGE
 * ============================================================ */

self.addEventListener("message", (event) => {
  if (
    event.data &&
    event.data.type === "SKIP_WAITING"
  ) {
    self.skipWaiting();
  }
});


/* ============================================================
 * ACTIVATE
 * ============================================================ */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("bashiri-") &&
              !key.startsWith(CACHE_VERSION)
          )
          .map((key) => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});


/* ============================================================
 * FETCH
 * ============================================================ */

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  /* ----------------------------------------------------------
   * 1. CROSS-ORIGIN REQUESTS
   *
   * VERY IMPORTANT:
   *
   * Render backend:
   * https://bashiri-backend.onrender.com
   *
   * Frontend:
   * https://bashiri.vercel.app
   *
   * These have different origins.
   *
   * The Service Worker MUST NOT intercept them.
   * ---------------------------------------------------------- */

  if (url.origin !== self.location.origin) {
    return;
  }


  /* ----------------------------------------------------------
   * 2. WEBSOCKET
   * ---------------------------------------------------------- */

  if (
    url.pathname.startsWith("/ws/") ||
    request.headers.get("upgrade") === "websocket"
  ) {
    return;
  }


  /* ----------------------------------------------------------
   * 3. SAME-ORIGIN API
   *
   * Never cache API responses.
   * ---------------------------------------------------------- */

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
    );

    return;
  }


  /* ----------------------------------------------------------
   * 4. PAGE NAVIGATION
   *
   * Network first.
   * If network fails -> offline page.
   * ---------------------------------------------------------- */

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(OFFLINE_URL)
          .then(
            (response) =>
              response || Response.error()
          )
      )
    );

    return;
  }


  /* ----------------------------------------------------------
   * 5. STATIC ASSETS
   *
   * Stale While Revalidate
   * ---------------------------------------------------------- */

  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    event.respondWith(
      caches
        .open(STATIC_CACHE)
        .then((cache) =>
          cache.match(request).then(
            (cachedResponse) => {

              const networkRequest = fetch(request)
                .then((networkResponse) => {

                  /*
                   * Only cache successful responses.
                   */
                  if (
                    networkResponse &&
                    networkResponse.ok
                  ) {
                    cache.put(
                      request,
                      networkResponse.clone()
                    );
                  }

                  return networkResponse;
                })
                .catch(() => {
                  return cachedResponse;
                });

              /*
               * Return cache immediately if available.
               */
              return (
                cachedResponse ||
                networkRequest
              );
            }
          )
        )
    );

    return;
  }


  /* ----------------------------------------------------------
   * 6. EVERYTHING ELSE
   *
   * Network only.
   * ---------------------------------------------------------- */

  event.respondWith(
    fetch(request)
  );
});


/* ============================================================
 * FIREBASE CLOUD MESSAGING
 * ============================================================ */

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js"
);


/* ------------------------------------------------------------
 * FIREBASE INITIALIZATION
 * ------------------------------------------------------------ */

firebase.initializeApp({
  apiKey: "${firebaseConfig.apiKey}",
  authDomain: "${firebaseConfig.authDomain}",
  projectId: "${firebaseConfig.projectId}",
  messagingSenderId: "${firebaseConfig.messagingSenderId}",
  appId: "${firebaseConfig.appId}",
});


/* ------------------------------------------------------------
 * FIREBASE MESSAGING
 * ------------------------------------------------------------ */

const messaging = firebase.messaging();


/* ============================================================
 * BACKGROUND PUSH NOTIFICATIONS
 * ============================================================ */

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.notification?.title ||
    "Bashiri";

  const body =
    payload.notification?.body ||
    "";

  const data =
    payload.data ||
    {};

  self.registration.showNotification(
    title,
    {
      body,

      icon: "/icon-192.png",

      badge: "/icon-192.png",

      data,

      tag:
        data.tag ||
        "bashiri-notification",
    }
  );
});


/* ============================================================
 * NOTIFICATION CLICK
 * ============================================================ */

self.addEventListener(
  "notificationclick",
  (event) => {

    event.notification.close();

    const targetUrl =
      event.notification.data?.click_action ||
      "/home";

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
        })
        .then((clientsArr) => {

          const existing =
            clientsArr.find(
              (client) =>
                client.url.includes(
                  self.location.origin
                )
            );

          if (existing) {

            existing.navigate(
              targetUrl
            );

            return existing.focus();
          }

          return self.clients.openWindow(
            targetUrl
          );
        })
    );
  }
);
`

  return new NextResponse(swContent, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',

      /*
       * Short cache so a new Service Worker can
       * propagate without waiting too long.
       */
      'Cache-Control':
        'public, max-age=60, must-revalidate',

      /*
       * Helps prevent unwanted transformations.
       */
      'X-Content-Type-Options':
        'nosniff',
    },
  })
}
```
