"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for the whole app, including /login.
 *
 * It has to live in the root layout rather than in the dashboard: Chrome only
 * fires `beforeinstallprompt` once a worker with a fetch handler controls the
 * page, so registering it behind the auth wall meant a signed-out admin could
 * never be offered the install. Renders nothing.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Never in development. The worker caches /_next/static/ cache-first, and
    // dev chunk URLs are reused across edits — so a registered worker serves
    // yesterday's JavaScript and edits appear not to apply. Tear down anything
    // left over from a previous dev session too.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.unregister());
      });
      caches?.keys().then((keys) => {
        keys.filter((k) => k.startsWith("adminhub-")).forEach((k) => caches.delete(k));
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.error("Service worker registration failed:", error);
    });

    // Browsers that registered the old standalone FCM worker still have it.
    // Two workers means two background-message handlers and duplicate banners.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations
        .filter((r) => r.active?.scriptURL.includes("firebase-messaging-sw.js"))
        .forEach((r) => r.unregister());
    });
  }, []);

  return null;
}
