// firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

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
  // Backend sends data-only messages (title/body in `data`) so the browser
  // doesn't auto-display AND fire this handler (which would double the banner).
  const data = payload.data || {};
  const title = payload.notification?.title || data.title || 'New Admin Notification';
  const options = {
    body: payload.notification?.body || data.body || '',
    icon: payload.notification?.image || data.image || '/favicon.ico',
    data,
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const action_url = event.notification.data?.action_url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        // If it's open, just focus it
        if (client.url.includes(action_url) && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(action_url);
      }
    })
  );
});
