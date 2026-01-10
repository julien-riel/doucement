/**
 * Service Worker - Notification Handlers
 * Gère les événements de notification en arrière-plan
 *
 * Note: Ce fichier est chargé par le service worker généré par vite-plugin-pwa
 */

// Message types for communication with main thread
const MESSAGE_TYPES = {
  SCHEDULE_NOTIFICATION: 'SCHEDULE_NOTIFICATION',
  CANCEL_NOTIFICATION: 'CANCEL_NOTIFICATION',
  CANCEL_ALL_NOTIFICATIONS: 'CANCEL_ALL_NOTIFICATIONS',
};

// Store for scheduled notification timeouts
const scheduledNotifications = new Map();

/**
 * Handle notification click - focus or open the app
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // No existing window, open a new one
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

/**
 * Handle messages from the main thread
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case MESSAGE_TYPES.SCHEDULE_NOTIFICATION:
      scheduleNotification(payload);
      break;
    case MESSAGE_TYPES.CANCEL_NOTIFICATION:
      cancelNotification(payload.id);
      break;
    case MESSAGE_TYPES.CANCEL_ALL_NOTIFICATIONS:
      cancelAllNotifications();
      break;
  }
});

/**
 * Schedule a notification
 */
function scheduleNotification({ id, title, body, delay, icon, tag }) {
  // Cancel existing notification with same id
  cancelNotification(id);

  const timeoutId = setTimeout(() => {
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icons/icon-192x192.png',
      tag: tag || `doucement-${id}`,
      badge: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      requireInteraction: false,
      data: { id },
    });

    // Remove from scheduled
    scheduledNotifications.delete(id);
  }, delay);

  scheduledNotifications.set(id, timeoutId);
}

/**
 * Cancel a scheduled notification
 */
function cancelNotification(id) {
  const timeoutId = scheduledNotifications.get(id);
  if (timeoutId) {
    clearTimeout(timeoutId);
    scheduledNotifications.delete(id);
  }
}

/**
 * Cancel all scheduled notifications
 */
function cancelAllNotifications() {
  scheduledNotifications.forEach((timeoutId) => clearTimeout(timeoutId));
  scheduledNotifications.clear();
}
