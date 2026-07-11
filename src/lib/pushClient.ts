const PUSH_PREFS_KEY = (userId: string) => `rt_push_prefs_${userId}`

export type PushPrefs = {
  enabled: boolean
  closedApp: boolean
}

const defaultPrefs = (): PushPrefs => ({ enabled: false, closedApp: true })

export const getPushPrefs = (userId: string): PushPrefs => {
  try {
    const raw = localStorage.getItem(PUSH_PREFS_KEY(userId))
    if (!raw) return defaultPrefs()
    return { ...defaultPrefs(), ...JSON.parse(raw) }
  } catch {
    return defaultPrefs()
  }
}

export const savePushPrefs = (userId: string, prefs: PushPrefs): void => {
  localStorage.setItem(PUSH_PREFS_KEY(userId), JSON.stringify(prefs))
}

export const isPushSupported = (): boolean =>
  typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator

export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export const fetchVapidPublicKey = async (): Promise<string | null> => {
  try {
    const res = await fetch('/api/push-vapid')
    const data = await res.json()
    return res.ok && data.publicKey ? String(data.publicKey) : null
  } catch {
    return null
  }
}

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}

export const subscribeDevicePush = async (
  ownerId: string,
  role: string,
  userId: string,
): Promise<{ ok: boolean; error?: string }> => {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return { ok: false, error: 'Notifications not supported on this browser' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, error: 'Notification permission denied' }
  }

  const publicKey = await fetchVapidPublicKey()
  if (!publicKey) {
    return { ok: false, error: 'Push not configured on server (VAPID keys missing)' }
  }

  const reg = (await registerServiceWorker()) || (await navigator.serviceWorker.ready)
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const res = await fetch('/api/push-subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerId,
      role,
      userId,
      subscription: sub.toJSON(),
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: data.error || 'Subscribe failed' }

  savePushPrefs(userId, { enabled: true, closedApp: true })
  return { ok: true }
}

export const unsubscribeDevicePush = async (userId: string): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    savePushPrefs(userId, { enabled: false, closedApp: false })
    return
  }
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch('/api/push-subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      })
      await sub.unsubscribe()
    }
  } catch {
    /* ignore */
  }
  savePushPrefs(userId, { enabled: false, closedApp: false })
}

export const setClosedAppPush = (userId: string, closedApp: boolean): void => {
  const prefs = getPushPrefs(userId)
  savePushPrefs(userId, { ...prefs, closedApp })
}

export const showLocalNotification = (title: string, body: string, url = '/'): void => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if (!document.hidden) return
  try {
    const n = new Notification(title, { body, icon: '/favicon.svg', tag: 'nyumba-local' })
    n.onclick = () => {
      window.focus()
      if (url && url !== '/') window.location.href = url
      n.close()
    }
  } catch {
    /* ignore */
  }
}
