import { defaultCache } from "@ducanh2912/next-pwa/worker";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NetworkFirst, CacheFirst, StaleWhileRevalidate } from "workbox-routing";
import { ExpirationPlugin } from "workbox-expiration";
import { RangeRequestsPlugin } from "workbox-range-requests";

declare const self: ServiceWorkerGlobalScope;

// Precache de assets do Next.js
precacheAndRoute(self.__WB_MANIFEST);

cleanupOutdatedCaches();

// --- Notificações Push ---
self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: '/cronolog_logo.svg',
        badge: '/favicon.svg',
        vibrate: [100, 50, 100],
        data: {
          url: data.url || '/'
        }
      };
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (e) {
      console.error('Erro ao processar notificação push:', e);
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
