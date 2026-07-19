"use client";
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export async function requestPushPermissionAndGetToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const supported = await isSupported();
  if (!supported) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  try {
    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token;
  } catch (err) {
    console.error("[FCM] Imeshindwa kupata token:", err);
    return null;
  }
}
