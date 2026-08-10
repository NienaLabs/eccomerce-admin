"use client";

import { useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { clientApi } from '@/lib/api';

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

import { useState } from 'react';

export function usePushNotificationsSetup() {
  const isRegisteredRef = useRef(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === 'undefined') return false;
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission === 'granted') {
        await setupFCM();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const setupFCM = async () => {
    if (isRegisteredRef.current || typeof window === 'undefined') return;
    try {
      if (!('serviceWorker' in navigator)) return;
      if (Notification.permission !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;
      const messaging = getMessaging(app);
      
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (currentToken) {
        const res = await clientApi('/users/me/fcm-token', {
          method: 'POST',
          body: JSON.stringify({ token: currentToken }),
        });
        if (res.ok) isRegisteredRef.current = true;
      }

      onMessage(messaging, (payload) => {
        console.log('[Foreground Push Notification Received]', payload);
      });
    } catch (error) {
      console.error('Error setting up FCM Web Push:', error);
    }
  };

  useEffect(() => {
    if (permissionStatus === 'granted') {
      setupFCM();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionStatus]);

  return { permissionStatus, requestPermission };
}
