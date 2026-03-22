// lib/pushNotifications.ts
// Web Push API — register service worker, schedule pre-event notifications

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    console.log('[push] Service worker registered')
    return reg
  } catch (err) {
    console.warn('[push] Service worker registration failed:', err)
    return null
  }
}

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function schedulePreEventNotification({
  eventName,
  eventDate,  // YYYY-MM-DD
  venue,
  userId,
}: {
  eventName: string
  eventDate: string
  venue:     string
  userId?:   string
}): Promise<boolean> {
  try {
    const granted = await requestPermission()
    if (!granted) return false

    const reg = await registerServiceWorker()
    if (!reg) return false

    // Calculate ms until 24h before event
    const eventMs  = new Date(eventDate).getTime()
    const now      = Date.now()
    const alertMs  = eventMs - 24 * 60 * 60 * 1000  // 24h before
    const delayMs  = alertMs - now

    if (delayMs <= 0) {
      // Event is within 24h — show notification immediately
      showLocalNotification({
        title: `Your event is today — ${eventName}`,
        body:  `📍 ${venue} · Check your itinerary for tickets, weather and directions.`,
        url:   '/',
        tag:   `event-today-${eventDate}`,
      })
      return true
    }

    // Schedule via setTimeout (works while tab is open)
    // For background notifications, use the push subscription
    setTimeout(() => {
      showLocalNotification({
        title: `Your event is tomorrow — ${eventName}`,
        body:  `📍 ${venue} · Check your itinerary for tickets, weather and directions.`,
        url:   '/',
        tag:   `event-tomorrow-${eventDate}`,
      })
    }, delayMs)

    // Also store push subscription for background delivery
    try {
      const sub = await reg.pushManager.getSubscription()
        ?? await reg.pushManager.subscribe({
             userVisibleOnly: true,
             applicationServerKey: urlBase64ToUint8Array(
               process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
                 ?? 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBkYIL38Jo0D'
             ),
           })

      await fetch('/api/push-subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subscription: sub, userId, eventName, eventDate, venue }),
      })
    } catch {
      // Push subscription optional — setTimeout fallback is active
    }

    console.log(`[push] Notification scheduled for ${eventName} on ${eventDate}`)
    return true

  } catch (err) {
    console.warn('[push] Failed to schedule notification:', err)
    return false
  }
}

// Show a local notification immediately (no server push needed)
export function showLocalNotification({
  title, body, url = '/', tag = 'gladys',
}: {
  title: string; body: string; url?: string; tag?: string
}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  navigator.serviceWorker.ready.then(reg => {
    reg.showNotification(title, {
      body,
      icon:    '/icon-192.png',
      badge:   '/icon-72.png',
      tag,
      data:    { url },
    })
  }).catch(() => {
    // Fallback to basic Notification API
    new Notification(title, { body, icon: '/icon-192.png', tag })
  })
}

// "Doors open" notification — shown when user is near venue
export function showDoorsOpenNotification(eventName: string, minutesUntil: number) {
  showLocalNotification({
    title: minutesUntil <= 0
      ? `Doors are open — ${eventName}`
      : `Doors open in ${minutesUntil} min — ${eventName}`,
    body:  'Head to the entrance now to avoid queues.',
    tag:   `doors-${eventName}`,
  })
}

// Helper: convert VAPID key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding  = '='.repeat((4 - base64String.length % 4) % 4)
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData  = window.atob(base64)
  const array    = Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
  return array.buffer
}