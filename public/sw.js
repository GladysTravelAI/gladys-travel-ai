// public/sw.js
// Service Worker — handles push notifications for pre-event alerts

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('push', e => {
  if (!e.data) return
  const data = e.data.json()

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/icon-192.png',
      badge:   '/icon-72.png',
      tag:     data.tag ?? 'gladys-event',
      vibrate: [200, 100, 200],
      data:    { url: data.url ?? '/' },
      actions: [
        { action: 'view',    title: 'View Itinerary' },
        { action: 'dismiss', title: 'Dismiss'         },
      ],
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  if (e.action === 'dismiss') return
  const url = e.notification.data?.url ?? '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url === url && 'focus' in c)
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})