"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { clientApi } from '@/lib/api';
import { useIsHydrated } from '@/hooks/useIsHydrated';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export function usePushNotificationsSetup() {
  const isRegisteredRef = useRef(false);
  const hydrated = useIsHydrated();
  // Only set from `requestPermission`, which runs off a click — never from an
  // effect. The browser's current value is read at render instead.
  const [granted, setGranted] = useState<NotificationPermission | null>(null);

  const permissionStatus: string =
    granted ??
    (hydrated && typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default');

  const setupFCM = useCallback(async () => {
    if (isRegisteredRef.current || typeof window === 'undefined') return;
    try {
      if (!('serviceWorker' in navigator)) return;
      if (Notification.permission !== 'granted') return;

      // InstallPrompt registers /sw.js on load — it handles both the offline
      // shell and FCM background messages — so wait for that one rather than
      // registering a second worker here.
      const registration = await navigator.serviceWorker.ready;
      const messaging = getMessaging(app);

      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (currentToken) {
        const res = await clientApi('/users/me/fcm-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentToken }),
        });
        if (res.ok) isRegisteredRef.current = true;
      }

      onMessage(messaging, (payload) => {
        console.log('[Foreground push notification received]', payload);
      });
    } catch (error) {
      console.error('Error setting up FCM web push:', error);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      setGranted(permission);
      if (permission === 'granted') {
        await setupFCM();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  }, [setupFCM]);

  useEffect(() => {
    // Registering the FCM token is a side effect on an external system, not a
    // state update, so it belongs here.
    if (permissionStatus === 'granted') {
      setupFCM();
    }
  }, [permissionStatus, setupFCM]);

  return { permissionStatus, requestPermission };
}
